import ChannelClientPage from '@/components/channel/ChannelClientPage';

export default function ChannelPage({
  params
}: {
  params: { channelId: string }
}) {
  return <ChannelClientPage channelId={params.channelId} />;
}
