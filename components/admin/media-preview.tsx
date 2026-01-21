"use client"

interface MediaPreviewProps {
  imageUrl?: string
  multimediaUrl?: string
  className?: string
}

export function MediaPreview({ imageUrl, multimediaUrl, className = "" }: MediaPreviewProps) {
  if (multimediaUrl) {
    return (
      <div className={`${className} bg-muted/50 flex items-center justify-center relative overflow-hidden`} style={{ minHeight: "200px" }}>
        {/* @ts-ignore */}
        <model-viewer
          src={multimediaUrl}
          poster={imageUrl}
          alt="3D Model Preview"
          auto-rotate
          camera-controls
          touch-action="pan-y"
          shadow-intensity="1"
          style={{ width: '100%', height: '100%', '--poster-color': 'transparent' }}
        >
          {imageUrl && (
            <div slot="poster" className="w-full h-full flex items-center justify-center">
              <img src={imageUrl} alt="Poster" className="max-w-full max-h-full object-contain opacity-50 blur-sm" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-background/80 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest animate-pulse border border-primary/20 shadow-2xl">
                  Loading 3D...
                </div>
              </div>
            </div>
          )}
          {/* @ts-ignore */}
        </model-viewer>
      </div>
    )
  }

  if (imageUrl) {
    return <img src={imageUrl} alt="Preview" className={`${className} object-cover w-full h-full`} />
  }

  return (
    <div className={`${className} bg-muted flex items-center justify-center`}>
      <span className="text-muted-foreground text-sm uppercase font-bold tracking-widest opacity-30 italic">No Media</span>
    </div>
  )
}



