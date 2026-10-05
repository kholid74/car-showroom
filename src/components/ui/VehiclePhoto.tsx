import photos from '@/data/vehicle-photos.json'
import { twMerge } from 'tailwind-merge'

type Photo = { src: string; source: string; author: string; license: string; licenseUrl: string }
export const vehiclePhotos = photos as Record<string, Photo>

export function VehiclePhoto({ unit, className = '', priority = false, credit = false }: {
  unit: { brand: string; model: string }; className?: string; priority?: boolean; credit?: boolean
}) {
  const photo = vehiclePhotos[`${unit.brand} ${unit.model}`]
  if (!photo) return <div className={`flex items-center justify-center bg-sunken text-ink-3 ${className}`}>{unit.brand} {unit.model}</div>
  return <div className={twMerge('relative overflow-hidden bg-sunken', className)}>
    <img src={photo.src} alt={`${unit.brand} ${unit.model} — foto ilustrasi model`} loading={priority ? 'eager' : 'lazy'} className="h-full w-full object-cover" />
    {credit && <a href={photo.source} target="_blank" rel="noreferrer" className="absolute bottom-3 left-3 rounded-full bg-black/65 px-3 py-1 text-[10px] text-white hover:bg-black/80" title={`${photo.author.replace(/<[^>]*>/g, '')} · ${photo.license}`}>
      Foto ilustrasi · {photo.license}
    </a>}
  </div>
}
