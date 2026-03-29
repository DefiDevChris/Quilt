import Image from 'next/image';

type Pose =
  | 'walking'
  | 'standing'
  | 'sitting'
  | 'jumping'
  | 'sleeping'
  | 'wagging'
  | 'fetching'
  | 'scratching'
  | 'licking'
  | 'waving'
  | 'running'
  | 'begging'
  | 'howling';
type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

const sizePx: Record<Size, number> = {
  xs: 32,
  sm: 64,
  md: 96,
  lg: 128,
  xl: 192,
  xxl: 256,
};

const poseMap: Record<Pose, string> = {
  walking: '/corgi1.png',
  standing: '/corgi2.png',
  sitting: '/corgi4.png',
  jumping: '/corgi-02-jumping-Photoroom.png',
  running: '/corgi-03-running-Photoroom.png',
  sleeping: '/corgi-05-sleeping-Photoroom.png',
  wagging: '/corgi-20-yawning-Photoroom.png',
  fetching: '/corgi-10-fetching-Photoroom.png',
  howling: '/corgi-11-howling-Photoroom.png',
  begging: '/corgi-13-begging-Photoroom.png',
  scratching: '/corgi-22-scratching-Photoroom.png',
  licking: '/corgi-16-licking-Photoroom.png',
  waving: '/corgi-01-sit-shake-Photoroom.png',
};

export default function Mascot({
  pose = 'walking',
  className = '',
  size = 'md',
}: {
  pose?: Pose;
  className?: string;
  size?: Size;
}) {
  const px = sizePx[size];
  return (
    <Image
      src={poseMap[pose]}
      alt="QuiltCorgi Mascot"
      width={px}
      height={px}
      unoptimized
      className={`object-contain ${className}`}
    />
  );
}
