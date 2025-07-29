interface LoadingStateProps {
  message?: string;
  height?: string;
}

export default function LoadingState({
  message = "Loading...",
  height = "h-48",
}: LoadingStateProps) {
  return (
    <div className={`${height} flex items-center justify-center text-sm muted`}>
      {message}
    </div>
  );
}
