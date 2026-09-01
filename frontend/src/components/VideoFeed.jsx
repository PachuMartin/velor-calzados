import React, { useState, useEffect, useRef } from 'react';
import { Heart, Share2, Volume2, VolumeX, ShoppingCart, Play, Pause, ExternalLink, RefreshCw } from 'lucide-react';

// Helper to parse TikTok and Instagram URLs
function parseEmbedData(url) {
  if (!url) return null;

  const instaRegex = /(?:instagram\.com)\/(?:p|reel|tv)\/([^/?#&]+)/i;
  const instaMatch = url.match(instaRegex);
  if (instaMatch && instaMatch[1]) {
    return {
      type: 'instagram',
      embedUrl: `https://www.instagram.com/p/${instaMatch[1]}/embed`
    };
  }

  const tiktokRegex = /(?:tiktok\.com)\/@[^/]+\/video\/(\d+)/i;
  const tiktokMatch = url.match(tiktokRegex);
  if (tiktokMatch && tiktokMatch[1]) {
    return {
      type: 'tiktok',
      embedUrl: `https://www.tiktok.com/embed/v2/${tiktokMatch[1]}`
    };
  }

  return null;
}

export default function VideoFeed({ videos, products, onOpenProduct, apiBase }) {
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const containerRef = useRef(null);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const scrollPosition = container.scrollTop;
    const videoHeight = container.clientHeight;
    
    const index = Math.round(scrollPosition / videoHeight);
    if (index !== activeVideoIndex && index >= 0 && index < videos.length) {
      setActiveVideoIndex(index);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, [activeVideoIndex, videos.length]);

  return (
    <div className="h-[calc(100vh-60px)] flex justify-center bg-black">
      <div 
        ref={containerRef}
        className="w-full max-w-[450px] h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar bg-zinc-950 sm:border-x border-zinc-900"
      >
        {videos.length > 0 ? (
          videos.map((video, index) => (
            <VideoCard 
              key={video.id}
              video={video}
              isActive={index === activeVideoIndex}
              product={products.find(p => p.id === video.productId)}
              onOpenProduct={onOpenProduct}
              apiBase={apiBase}
            />
          ))
        ) : (
          <div className="h-full flex items-center justify-center flex-col text-gray-500 p-8 text-center gap-3">
            <Play size={40} className="text-zinc-700 animate-pulse" />
            <p className="text-sm font-bold">No hay videos en el feed.</p>
            <p className="text-xs text-zinc-600">Inicia sesión como administrador y añade URLs de TikTok o Instagram vinculadas a tus productos.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function VideoCard({ video, isActive, product, onOpenProduct, apiBase }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(video.likes || 0);
  const [showPlayAnim, setShowPlayAnim] = useState(false);

  const embedData = parseEmbedData(video.videoUrl);
  const isEmbed = !!embedData;

  const fullVideoUrl = video.videoUrl.startsWith('http') 
    ? video.videoUrl 
    : `${apiBase.replace('/api', '')}${video.videoUrl}`;

  // Control raw HTML5 video playback
  useEffect(() => {
    if (!isEmbed && videoRef.current) {
      if (isActive) {
        videoRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(err => {
            console.warn("Autoplay blocked:", err);
            setIsPlaying(false);
          });
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
        setIsPlaying(false);
      }
    }
  }, [isActive, isEmbed]);

  const togglePlay = () => {
    if (isEmbed) return;
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.error(err));
    }
    setShowPlayAnim(true);
    setTimeout(() => setShowPlayAnim(false), 500);
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    if (isEmbed) return;
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleLike = (e) => {
    e.stopPropagation();
    if (isLiked) {
      setIsLiked(false);
      setLikesCount(prev => prev - 1);
    } else {
      setIsLiked(true);
      setLikesCount(prev => prev + 1);
    }
  };

  const handleShare = (e) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: product?.name || 'Prenda de Moda',
        text: video.caption,
        url: video.videoUrl,
      }).catch(err => console.log(err));
    } else {
      navigator.clipboard.writeText(video.videoUrl);
      alert('¡Enlace del video copiado al portapapeles!');
    }
  };

  const productImageUrl = product && product.images && product.images[0]
    ? (product.images[0].startsWith('http') ? product.images[0] : `${apiBase.replace('/api', '')}${product.images[0]}`)
    : 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500';

  return (
    <div 
      className="relative w-full h-[calc(100vh-60px)] snap-start bg-black flex items-center justify-center cursor-pointer select-none"
      onClick={togglePlay}
    >
      {isEmbed ? (
        /* Native Embed Iframe with Lazy Loading */
        isActive ? (
          <div className="w-full h-full pt-2 pb-14 bg-zinc-950 flex items-center justify-center animate-fade-in">
            <iframe
              src={embedData.embedUrl}
              className="w-full h-[92%] border-0 overflow-hidden"
              scrolling="no"
              allowFullScreen
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              title={`${embedData.type} video embed`}
            />
          </div>
        ) : (
          /* Thumbnail Placeholder when video is inactive */
          <div className="relative w-full h-full bg-zinc-950 flex items-center justify-center overflow-hidden">
            {/* Blurred Product Image Background */}
            <img 
              src={productImageUrl} 
              alt="" 
              className="absolute inset-0 w-full h-full object-cover filter blur-xl opacity-20 scale-110" 
            />
            {/* Play Button Overlay */}
            <div className="z-10 flex flex-col items-center gap-3 text-zinc-500 bg-black/40 p-6 rounded-3xl border border-white/5 backdrop-blur-sm">
              <div className="w-14 h-14 bg-pink-500/20 text-pink-500 rounded-full flex items-center justify-center border border-pink-500/30 animate-pulse">
                <Play size={26} className="fill-pink-500 ml-1" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">Desliza para reproducir</span>
            </div>
          </div>
        )
      ) : (
        /* Fallback HTML5 Video Player */
        <>
          <video
            ref={videoRef}
            src={fullVideoUrl}
            className="w-full h-full object-cover"
            loop
            playsInline
            muted={isMuted}
          />

          {showPlayAnim && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/10 z-10">
              <div className="p-4 rounded-full bg-black/60 text-white animate-ping">
                {isPlaying ? <Play size={40} className="fill-white" /> : <Pause size={40} className="fill-white" />}
              </div>
            </div>
          )}

          <button
            onClick={toggleMute}
            className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm border border-white/10 transition-all"
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </>
      )}

      {/* Right Interaction Sidebar */}
      <div className="absolute right-3 bottom-24 z-30 flex flex-col gap-5 items-center">
        {/* Like Button */}
        <button 
          onClick={handleLike}
          className="flex flex-col items-center gap-1 text-white filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
        >
          <div className={`p-3 rounded-full bg-black/40 backdrop-blur-sm border border-white/5 transition-transform active:scale-75 ${isLiked ? 'text-pink-500' : 'text-white hover:text-rose-400'}`}>
            <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
          </div>
          <span className="text-[11px] font-bold">{likesCount}</span>
        </button>

        {/* Share/Copy Original Video URL Button */}
        <button 
          onClick={handleShare}
          className="flex flex-col items-center gap-1 text-white filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
          title="Compartir o Copiar Enlace"
        >
          <div className="p-3 rounded-full bg-black/40 backdrop-blur-sm border border-white/5 hover:text-pink-400 active:scale-75 transition-all">
            <Share2 size={20} />
          </div>
          <span className="text-[11px] font-bold">Compartir</span>
        </button>

        {/* Open Original Post Link */}
        <a 
          href={video.videoUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-1 text-white filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
          title="Ver en Red Social Original"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-3 rounded-full bg-black/40 backdrop-blur-sm border border-white/5 hover:text-pink-400 active:scale-75 transition-all">
            <ExternalLink size={20} />
          </div>
          <span className="text-[11px] font-bold">Ver original</span>
        </a>

        {/* Product Shop Preview */}
        {product && (
          <button 
            onClick={(e) => { e.stopPropagation(); onOpenProduct(product); }}
            className="flex flex-col items-center gap-1 text-white mt-1 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
            title="Ver Producto"
          >
            <div className="w-12 h-12 rounded-full border-2 border-pink-500 overflow-hidden bg-white active:scale-90 transition-all p-0.5 animate-spin-slow">
              <img 
                src={productImageUrl} 
                alt={product.name} 
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <span className="text-[10px] text-pink-400 font-extrabold bg-black/70 px-1.5 py-0.5 rounded mt-1">Shop</span>
          </button>
        )}
      </div>

      {/* Bottom overlay details and connect product card */}
      <div 
        className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/95 via-black/40 to-transparent z-25 flex flex-col gap-3 pointer-events-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pointer-events-auto max-w-[82%] text-left">
          {/* Caption text */}
          <p className="text-xs font-normal text-gray-200 line-clamp-2 filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            {video.caption}
          </p>

          {/* Product shopping banner */}
          {product && (
            <div 
              onClick={() => onOpenProduct(product)}
              className="mt-3 flex items-center justify-between bg-black/70 backdrop-blur-md border border-white/10 rounded-2xl p-2.5 hover:bg-black/90 transition-all cursor-pointer shadow-lg"
            >
              <div className="flex items-center gap-2">
                <img 
                  src={productImageUrl} 
                  alt={product.name} 
                  className="w-12 h-12 object-cover rounded-xl border border-zinc-800"
                />
                <div>
                  <h4 className="text-xs font-bold text-white line-clamp-1">{product.name}</h4>
                  <p className="text-[10px] text-zinc-400">{product.category}</p>
                  <p className="text-xs font-extrabold text-pink-400">${product.price.toFixed(2)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-1 bg-pink-500 text-white text-[10px] font-bold px-3 py-2 rounded-xl active:scale-95 transition-all shadow-md">
                <ShoppingCart size={11} />
                Comprar
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
