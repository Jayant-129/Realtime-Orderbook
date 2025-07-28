"use client";

import React from "react";
import { useAppSelector, useAppDispatch } from "@/store";
import { clearBanner, type Banner } from "@/store/uiSlice";

/**
 * Banner display component for connection status and warnings
 * Features: Styled banners by type, auto-dismiss, proper dark theme
 */

export default function BannerDisplay() {
  const banners = useAppSelector((state) => state.ui.banners);
  const dispatch = useAppDispatch();

  const handleDismiss = (bannerId: string) => {
    dispatch(clearBanner(bannerId));
  };

  if (banners.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      {banners.map((banner) => (
        <BannerItem
          key={banner.id}
          banner={banner}
          onDismiss={() => handleDismiss(banner.id)}
        />
      ))}
    </div>
  );
}

type BannerItemProps = {
  banner: Banner;
  onDismiss: () => void;
};

function BannerItem({ banner, onDismiss }: BannerItemProps) {
  const typeStyles = {
    info: "bg-blue-900/90 border-blue-600 text-blue-100",
    warning: "bg-yellow-900/90 border-yellow-600 text-yellow-100",
    error: "bg-red-900/90 border-red-600 text-red-100",
    success: "bg-green-900/90 border-green-600 text-green-100",
  };

  const iconMap = {
    info: "ℹ️",
    warning: "⚠️",
    error: "❌",
    success: "✅",
  };

  return (
    <div
      className={`
      flex items-center gap-3 p-3 rounded-lg border backdrop-blur-sm
      shadow-lg banner-enter
      ${typeStyles[banner.type]}
    `}
    >
      <span className="text-lg flex-shrink-0">{iconMap[banner.type]}</span>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium break-words">{banner.message}</p>
        {banner.timestamp && (
          <p className="text-xs opacity-75 mt-1">
            {new Date(banner.timestamp).toLocaleTimeString()}
          </p>
        )}
      </div>

      <button
        onClick={onDismiss}
        className="flex-shrink-0 p-1 rounded hover:bg-white/10 transition-colors"
        aria-label="Dismiss"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
        </svg>
      </button>
    </div>
  );
}
