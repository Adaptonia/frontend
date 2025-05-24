import ChannelClientPage from '@/components/channel/ChannelClientPage';

interface PageProps {
  params: Promise<{ channelId: string }>;
}

export default async function ChannelPage({ params }: PageProps) {
  const { channelId } = await params;
  
  return <ChannelClientPage channelId={channelId} />;
} 