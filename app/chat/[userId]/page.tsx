import ChatDetailClient from './ChatDetailClient';

interface ChatDetailPageProps {
  params: Promise<{ userId: string }>;
}

export default async function ChatDetailPage({ params }: ChatDetailPageProps) {
  const { userId } = await params;
  
  return <ChatDetailClient userId={userId} />;
}