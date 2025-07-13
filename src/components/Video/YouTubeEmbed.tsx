interface YouTubeEmbedProps {
  videoId: string;
  title: string;
  className?: string;
}

export const YouTubeEmbed = ({ videoId, title, className = "" }: YouTubeEmbedProps) => {
  return (
    <div className={`relative aspect-video ${className}`}>
      <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 w-full h-full rounded-lg"
      />
    </div>
  );
};