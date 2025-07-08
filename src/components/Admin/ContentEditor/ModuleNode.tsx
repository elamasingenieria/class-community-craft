
import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Plus, Settings } from 'lucide-react';

interface ModuleNodeProps {
  data: {
    id: string;
    title: string;
    description: string;
    is_published: boolean;
    topicsCount: number;
    onEdit: (id: string) => void;
    onAddTopic: (moduleId: string) => void;
  };
}

const ModuleNode = memo(({ data }: ModuleNodeProps) => {
  return (
    <Card className="w-64 shadow-lg border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-sm font-semibold text-blue-800">
              Módulo
            </CardTitle>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => data.onEdit(data.id)}
              className="p-1 hover:bg-blue-200 rounded"
            >
              <Settings className="h-3 w-3 text-blue-600" />
            </button>
            <button
              onClick={() => data.onAddTopic(data.id)}
              className="p-1 hover:bg-blue-200 rounded"
            >
              <Plus className="h-3 w-3 text-blue-600" />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <h3 className="font-medium text-sm mb-2 text-gray-800">{data.title}</h3>
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">{data.description}</p>
        <div className="flex items-center justify-between">
          <Badge variant={data.is_published ? "default" : "secondary"} className="text-xs">
            {data.is_published ? "Publicado" : "Borrador"}
          </Badge>
          <span className="text-xs text-gray-500">
            {data.topicsCount} tema{data.topicsCount !== 1 ? 's' : ''}
          </span>
        </div>
      </CardContent>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-blue-500" />
    </Card>
  );
});

ModuleNode.displayName = 'ModuleNode';

export default ModuleNode;
