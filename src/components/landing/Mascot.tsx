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
  walking: '/mascots&avatars/corgi27.png',
  standing: '/mascots&avatars/corgi28.png',
  sitting: '/mascots&avatars/corgi29.png',
  jumping: '/mascots&avatars/corgi13.png',
  running: '/mascots&avatars/corgi14.png',
  sleeping: '/mascots&avatars/corgi15.png',
  wagging: '/mascots&avatars/corgi25.png',
  fetching: '/mascots&avatars/corgi18.png',
  howling: '/mascots&avatars/corgi19.png',
  begging: '/mascots&avatars/corgi20.png',
  scratching: '/mascots&avatars/corgi26.png',
  licking: '/mascots&avatars/corgi23.png',
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
      className={`object-contain bg-transparent ${className}`}
    />
  );
}
