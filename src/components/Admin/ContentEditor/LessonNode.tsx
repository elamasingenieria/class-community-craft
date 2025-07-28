
import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Settings, Youtube } from 'lucide-react';

interface LessonNodeProps {
  data: {
    id: string;
    title: string;
    description: string;
    is_published: boolean;
    youtube_url?: string;
    onEdit: (id: string) => void;
  };
}

const LessonNode = memo(({ data }: LessonNodeProps) => {
  return (
    <Card className="w-48 shadow-lg border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 dark:border-purple-800 dark:from-purple-950 dark:to-purple-900">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Play className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <CardTitle className="text-sm font-semibold text-purple-800 dark:text-purple-200">
              Lección
            </CardTitle>
          </div>
          <button
            onClick={() => data.onEdit(data.id)}
            className="p-1 hover:bg-purple-200 dark:hover:bg-purple-800 rounded transition-colors"
            title="Editar lección"
          >
            <Settings className="h-3 w-3 text-purple-600 dark:text-purple-400" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <h3 className="font-medium text-sm mb-2 text-foreground">{data.title}</h3>
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{data.description}</p>
        <div className="flex items-center justify-between">
          <Badge variant={data.is_published ? "default" : "secondary"} className="text-xs">
            {data.is_published ? "Publicado" : "Borrador"}
          </Badge>
          {data.youtube_url && (
            <Youtube className="h-3 w-3 text-red-500" />
          )}
        </div>
      </CardContent>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-purple-500" />
    </Card>
  );
});

LessonNode.displayName = 'LessonNode';

export default LessonNode;
