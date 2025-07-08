
import { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  Panel,
} from '@xyflow/react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus, Save, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import ModuleNode from './ModuleNode';
import TopicNode from './TopicNode';
import LessonNode from './LessonNode';
import { ContentForm } from './ContentForm';

import '@xyflow/react/dist/style.css';

const nodeTypes = {
  module: ModuleNode,
  topic: TopicNode,
  lesson: LessonNode,
};

interface Module {
  id: string;
  title: string;
  description: string;
  order_index: number;
  is_published: boolean;
  topics: Topic[];
}

interface Topic {
  id: string;
  title: string;
  description: string;
  order_index: number;
  is_published: boolean;
  module_id: string;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  order_index: number;
  is_published: boolean;
  topic_id: string;
  youtube_url?: string;
}

export const ContentEditor = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<{
    type: 'module' | 'topic' | 'lesson';
    data: any;
    parentId?: string;
  } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: modulesData, error } = await supabase
        .from('modules')
        .select(`
          *,
          topics (
            *,
            lessons (*)
          )
        `)
        .order('order_index');

      if (error) throw error;

      setModules(modulesData || []);
      generateNodesAndEdges(modulesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateNodesAndEdges = (modulesData: Module[]) => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    let yOffset = 0;
    const moduleSpacing = 300;
    const topicSpacing = 250;
    const lessonSpacing = 200;

    modulesData.forEach((module, moduleIndex) => {
      // Add module node
      newNodes.push({
        id: `module-${module.id}`,
        type: 'module',
        position: { x: 0, y: yOffset },
        data: {
          id: module.id,
          title: module.title,
          description: module.description || '',
          is_published: module.is_published || false,
          topicsCount: module.topics?.length || 0,
          onEdit: (id: string) => handleEdit('module', id),
          onAddTopic: (moduleId: string) => handleAdd('topic', moduleId),
        },
      });

      let topicXOffset = 300;
      
      module.topics?.forEach((topic, topicIndex) => {
        const topicY = yOffset + (topicIndex * topicSpacing);
        
        // Add topic node
        newNodes.push({
          id: `topic-${topic.id}`,
          type: 'topic',
          position: { x: topicXOffset, y: topicY },
          data: {
            id: topic.id,
            title: topic.title,
            description: topic.description || '',
            is_published: topic.is_published || false,
            lessonsCount: topic.lessons?.length || 0,
            onEdit: (id: string) => handleEdit('topic', id),
            onAddLesson: (topicId: string) => handleAdd('lesson', topicId),
          },
        });

        // Add edge from module to topic
        newEdges.push({
          id: `edge-module-${module.id}-topic-${topic.id}`,
          source: `module-${module.id}`,
          target: `topic-${topic.id}`,
          type: 'smoothstep',
        });

        let lessonXOffset = topicXOffset + 300;
        
        topic.lessons?.forEach((lesson, lessonIndex) => {
          const lessonY = topicY + (lessonIndex * lessonSpacing);
          
          // Add lesson node
          newNodes.push({
            id: `lesson-${lesson.id}`,
            type: 'lesson',
            position: { x: lessonXOffset, y: lessonY },
            data: {
              id: lesson.id,
              title: lesson.title,
              description: lesson.description || '',
              is_published: lesson.is_published || false,
              youtube_url: lesson.youtube_url,
              onEdit: (id: string) => handleEdit('lesson', id),
            },
          });

          // Add edge from topic to lesson
          newEdges.push({
            id: `edge-topic-${topic.id}-lesson-${lesson.id}`,
            source: `topic-${topic.id}`,
            target: `lesson-${lesson.id}`,
            type: 'smoothstep',
          });
        });
      });

      yOffset += moduleSpacing + (module.topics?.length || 0) * topicSpacing;
    });

    setNodes(newNodes);
    setEdges(newEdges);
  };

  const handleAdd = (type: 'module' | 'topic' | 'lesson', parentId?: string) => {
    setFormData({
      type,
      data: {
        title: '',
        description: '',
        is_published: false,
        youtube_url: type === 'lesson' ? '' : undefined,
      },
      parentId,
    });
  };

  const handleEdit = (type: 'module' | 'topic' | 'lesson', id: string) => {
    let item;
    
    if (type === 'module') {
      item = modules.find(m => m.id === id);
    } else if (type === 'topic') {
      item = modules.flatMap(m => m.topics).find(t => t.id === id);
    } else {
      item = modules.flatMap(m => m.topics).flatMap(t => t.lessons).find(l => l.id === id);
    }

    if (item) {
      setFormData({
        type,
        data: item,
      });
    }
  };

  const handleSave = async (data: any) => {
    try {
      const { type, parentId } = formData!;
      
      if (data.id) {
        // Update existing
        const { error } = await supabase
          .from(`${type}s`)
          .update(data)
          .eq('id', data.id);
        
        if (error) throw error;
        
        toast({
          title: "¡Actualizado!",
          description: `${type === 'module' ? 'Módulo' : type === 'topic' ? 'Tema' : 'Lección'} actualizado exitosamente.`
        });
      } else {
        // Create new
        const insertData = {
          ...data,
          order_index: 1, // You might want to calculate this properly
        };

        if (type === 'topic' && parentId) {
          insertData.module_id = parentId;
        } else if (type === 'lesson' && parentId) {
          insertData.topic_id = parentId;
        }

        const { error } = await supabase
          .from(`${type}s`)
          .insert(insertData);
        
        if (error) throw error;
        
        toast({
          title: "¡Creado!",
          description: `${type === 'module' ? 'Módulo' : type === 'topic' ? 'Tema' : 'Lección'} creado exitosamente.`
        });
      }

      setFormData(null);
      fetchData();
    } catch (error) {
      console.error('Error saving:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el contenido",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-[600px] w-full border rounded-lg bg-gray-50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Background />
        <Controls />
        <MiniMap />
        <Panel position="top-right" className="bg-white p-2 rounded-lg shadow-lg">
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => handleAdd('module')}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Módulo
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={fetchData}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </Button>
          </div>
        </Panel>
      </ReactFlow>

      {formData && (
        <ContentForm
          type={formData.type}
          data={formData.data}
          onSave={handleSave}
          onCancel={() => setFormData(null)}
        />
      )}
    </div>
  );
};
