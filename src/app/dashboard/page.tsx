import { DashboardCard } from '@/components/dashboard/DashboardCard';

const cards = [
  {
    href: '/studio',
    imageSrc: '/icons/quilt-quilt.png',
    imageAlt: 'Quilt',
    label: 'Creator',
    title: 'Design a Quilt',
    description: 'Start with a blank canvas and draft your heirloom pattern.',
    cta: 'Start Designing',
    variant: 'primary' as const,
  },
  {
    href: '/blog',
    imageSrc: '/icons/quilt-book.png',
    imageAlt: 'Blog',
    label: 'Editorial',
    title: 'Blog',
    description: 'Read tutorials, expert tips, and daily inspiration from our community.',
    cta: 'Get Inspired',
    variant: 'surface' as const,
  },
  {
    href: '/fabrics',
    imageSrc: '/icons/quilt-01-spool-Photoroom.png',
    imageAlt: 'Fabrics',
    label: 'Library',
    title: 'Browse Fabrics',
    description: 'Browse curated quilting fabrics with shop links. Find the perfect print for your next project.',
    cta: 'Browse Fabrics',
    variant: 'secondary' as const,
    span: 'lg:row-span-2',
  },
  {
    href: '/picture-my-blocks',
    imageSrc: '/icons/quilt-13-dashed-squares-Photoroom.png',
    imageAlt: 'Blocks',
    label: 'Visualizer',
    title: 'Picture My Blocks',
    description: 'Design a quilt with your uploaded blocks. Drag blocks onto a customizable grid and preview with fabrics.',
    cta: 'Start Designing',
    variant: 'surface' as const,
  },
  {
    href: '/photo-to-quilt',
    imageSrc: '/icons/template.png',
    imageAlt: 'Photo to Quilt',
    label: 'Converter',
    title: 'Photo to Quilt',
    description: 'Turn any photo into a quilt pattern. Background removed automatically, ready-to-sew blocks generated.',
    cta: 'Convert Now',
    variant: 'surface' as const,
  },
  {
    href: '/my-fabrics',
    imageSrc: '/icons/quilt-10-pincushion-Photoroom.png',
    imageAlt: 'Upload',
    label: 'Upload',
    title: 'Upload Blocks & Fabrics',
    description: 'Add your own fabric swatches and quilt blocks to use in your designs.',
    cta: 'Upload Now',
    variant: 'accent' as const,
  },
];

export default function DashboardPage() {
  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_1fr_0.75fr] gap-8 min-h-0 relative pb-8">
      {cards.map((card) => (
        <DashboardCard key={card.href} {...card} />
      ))}
    </div>
  );
}
