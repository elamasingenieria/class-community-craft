
import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Settings } from 'lucide-react';

interface TopicNodeProps {
  data: {
    id: string;
    title: string;
    description: string;
    is_published: boolean;
    lessonsCount: number;
    onEdit: (id: string) => void;
    onAddLesson: (topicId: string) => void;
  };
}

const TopicNode = memo(({ data }: TopicNodeProps) => {
  return (
    <Card className="w-56 shadow-lg border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-green-600" />
            <CardTitle className="text-sm font-semibold text-green-800">
              Tema
            </CardTitle>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => data.onEdit(data.id)}
              className="p-1 hover:bg-green-200 rounded"
            >
              <Settings className="h-3 w-3 text-green-600" />
            </button>
            <button
              onClick={() => data.onAddLesson(data.id)}
              className="p-1 hover:bg-green-200 rounded"
            >
              <Plus className="h-3 w-3 text-green-600" />
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
            {data.lessonsCount} lección{data.lessonsCount !== 1 ? 'es' : ''}
          </span>
        </div>
      </CardContent>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-green-500" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-green-500" />
    </Card>
  );
});

TopicNode.displayName = 'TopicNode';

export default TopicNode;
