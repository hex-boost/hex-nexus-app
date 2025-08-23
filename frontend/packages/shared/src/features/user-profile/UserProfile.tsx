import type { UserType } from '@/types/types.ts';
import type React from 'react';
import type { Crop } from 'react-image-crop';
import { DiscordSvg } from '@/assets/icons.tsx';
import logoBoostRoyal from '@/assets/logo-boost-royal.svg';
import logoTurboBoost from '@/assets/logo-turbo-boost.png';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { RainbowButton } from '@/components/ui/rainbow-button.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip.tsx';
import { useMembership } from '@/hooks/useMembership.ts';
import { useProfileAvatar } from '@/hooks/useProfileAvatar.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Browser } from '@wailsio/runtime';
import { Check, CheckCircle, Crown, ExternalLink, LogOut, Pencil, X } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import ReactCrop, { cls } from 'react-image-crop';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button.tsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog.tsx';
import 'react-image-crop/dist/ReactCrop.css';

type MenuItem = {
  label: string;
  external_link?: string;
  value?: string;
  href: string;
  icon?: React.ReactNode;
  external?: boolean;
};

export type UserProfileProps = {
  user: UserType | null;
  logoutAction: () => void;
  updateAction: () => void;
};

export function UserProfile({
  user,
  logoutAction,
}: UserProfileProps) {
  const queryClient = useQueryClient();
  const { updateUserAvatarFromBase64 } = useProfileAvatar();

  const [isHover, setHover] = useState(false);
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);

  const { getTierColorClass } = useMembership();
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 80,
    height: 80,
    x: 10,
    y: 10,
  });
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [_, setImgDimensions] = useState({ width: 0, height: 0 });
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
    },
    multiple: false,
    noClick: true,
    noKeyboard: true,
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setImageToCrop(event.target.result as string);
            setCropModalOpen(true);
          }
        };
        reader.readAsDataURL(file);
      }
    },
  });

  const handleCancel = () => {
    setPreviewAvatar(null);
  };

  const { mutate: handleChangeAvatar } = useMutation({
    mutationKey: ['update-avatar', user?.id],
    mutationFn: async () => {
      return toast.promise(updateUserAvatarFromBase64(previewAvatar!, user?.id || 0), {
        loading: 'Updating avatar',
        success: 'Avatar updated successfully',
        error: 'An unexpected error occurred',
        finally: () => {
          queryClient.invalidateQueries({
            queryKey: ['users', 'me'],
          });
        },
      });
    },
  });
  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setImgDimensions({ width, height });
    const size = Math.min(width, height) * 0.8;
    const x = (width - size) / 2;
    const y = (height - size) / 2;
    setCrop({
      unit: 'px',
      width: size,
      height: size,
      x,
      y,
    });
  };
  const getCroppedImg = useCallback(() => {
    if (!imgRef.current || !crop.width || !crop.height) {
      return;
    }
    const image = imgRef.current;
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const canvas = document.createElement('canvas');
    const pixelCrop = {
      x: crop.x * (crop.unit === '%' ? image.width / 100 : 1),
      y: crop.y * (crop.unit === '%' ? image.height / 100 : 1),
      width: crop.width * (crop.unit === '%' ? image.width / 100 : 1),
      height: crop.height * (crop.unit === '%' ? image.height / 100 : 1),
    };
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    ctx.drawImage(
      image,
      pixelCrop.x * scaleX,
      pixelCrop.y * scaleY,
      pixelCrop.width * scaleX,
      pixelCrop.height * scaleY,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height,
    );
    return canvas.toDataURL('image/jpeg');
  }, [crop]);
  const handleCropComplete = () => {
    const croppedImage = getCroppedImg();
    if (croppedImage) {
      setPreviewAvatar(croppedImage);
      setCropModalOpen(false);
      setImageToCrop(null);
    }
  };
  const textClass = user?.premium?.plan?.name?.toLowerCase()
    ? getTierColorClass(user.premium.plan.name.toLowerCase())?.text
    : getTierColorClass('free').text;
  const menuItems: MenuItem[] = [
    {
      label: 'Membership',
      value: user?.premium?.plan?.name?.toLowerCase()
        ? user?.premium?.plan?.name?.slice(0, 1).toUpperCase() + user?.premium?.plan?.name?.slice(1)
        : 'Free',
      href: '/subscription',
      icon: <Crown className="w-4 h-4" />,
    },

    {
      label: 'Discord',
      href: 'https://discord.gg/Vew8tvRWVZ',
      external: true,
      icon: <DiscordSvg size="16" />,
    },
  ];
  const { isPending, mutate } = useMutation({
    mutationKey: ['open', 'url'],
    mutationFn: async (href: string) => {
      await Browser.OpenURL(href);
    },
  });
  return (
    <>
      <div className="w-full max-w-sm mx-auto">
        <div className="relative rounded-2xl border ">
          <div className="relative pt-8 pb-6">
            <div className="flex px-6 items-center gap-4 mb-8">
              <div className="relative shrink-0 " {...getRootProps()}>
                <TooltipProvider delayDuration={100}>
                  <div className="relative group">
                    <div className="relative">
                      <Avatar
                        className={`rounded-full ring-4 ring-white dark:ring-zinc-900 ${isDragActive ? 'opacity-75' : ''
                        }`}
                        style={{
                          width: '72px',
                          height: '72px',
                          objectFit: 'cover',
                          border: isDragActive ? '2px solid #3b82f6' : 'none',
                        }}
                      >
                        <AvatarImage
                          src={previewAvatar || (user?.avatar?.url ? import.meta.env.VITE_API_URL + user.avatar.url : undefined)}
                          alt={user?.username || 'User'}
                        />

                        <AvatarFallback><Skeleton className="w-[72px] h-[72px]" /></AvatarFallback>
                      </Avatar>
                      {isDragActive && (
                        <div className="absolute inset-0 bg-primary/20 rounded-full flex items-center justify-center">
                          <p className="text-white font-medium text-sm">Drop image here</p>
                        </div>
                      )}

                    </div>
                    <div className="absolute -bottom-0 right-0 p-0.5  bg-background hover:opacity-95   rounded-full border shadow-sm flex gap-1">
                      {!previewAvatar
                        ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={open}
                                  className="p-0.5 rounded-full transition-colors"
                                >
                                  <Pencil className="w-4 h-4 text-foreground/80" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="px-2 py-1 text-sm">
                                Edit avatar
                              </TooltipContent>
                            </Tooltip>
                          )
                        : (
                            <>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    onClick={() => handleChangeAvatar()}
                                    className="p-0.5 hover:bg-green-100 dark:hover:bg-green-800 rounded-full transition-colors"
                                  >
                                    <Check className="w-4 h-4 text-green-600 dark:text-green-300" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="left" className="px-2 py-1 text-white text-sm">
                                  Confirm
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="reset"
                                    onClick={handleCancel}
                                    className="p-0.5 hover:bg-red-100 dark:hover:bg-red-800 rounded-full transition-colors"
                                  >
                                    <X className="w-4 h-4 text-red-600 dark:text-red-300" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="px-2 py-1 text-sm">
                                  Cancel
                                </TooltipContent>
                              </Tooltip>
                            </>
                          )}
                    </div>
                    <input {...getInputProps()} />
                  </div>
                </TooltipProvider>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{user?.username}</h2>
                <div className="w-full flex justify-between gap-2">
                  <p className={cls(` capitalize`, textClass)}>{user?.premium?.plan?.name || 'Free'}</p>

                  {user?.accountPermissions?.includes('boostroyal') && user?.boostRoyalUserId && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex gap-2 items-center w-fit rounded-full py-0.5 px-3 bg-boostroyal-primary/10">
                            <p className="text-xs font-bold text-boostroyal-primary">Boost Royal</p>
                            <img src={logoBoostRoyal} alt="BoostRoyal" className="h-4 w-4" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="px-2 py-1 items-center text-sm flex gap-2">
                          <span>
                            Boost Royal Verified
                          </span>
                          {' '}
                          <CheckCircle className="text-green-400" size={16} />
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  {user?.accountPermissions?.includes('turboboost') && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex gap-2 items-center w-fit rounded-full py-0.5 px-3 bg-turboboost-primary/10">
                            <p className="text-xs font-bold text-turboboost-primary">Turbo Boost</p>
                            <img src={logoTurboBoost} alt="Turbo Boost" className="h-4 w-4" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="px-2 py-1 items-center text-sm flex gap-2">
                          <span>
                            Turbo Boost Verified
                          </span>
                          {' '}
                          <CheckCircle className="text-green-400" size={16} />
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}

                </div>
              </div>
            </div>
            <Separator className="mb-6" />
            <div className="flex flex-col gap-2 px-6">
              {menuItems.map((item) => {
                const isDiscord = item.label === 'Discord';
                return isDiscord
                  ? (
                      <Button
                        variant="custom"
                        onMouseEnter={() => setTimeout(() => setHover(true), 200)}
                        onMouseLeave={() => setTimeout(() => setHover(false), 200)}
                        key={item.label}
                        disabled={isPending}
                        onClick={() => mutate(item.href)}
                        className="flex w-full items-center justify-between  py-2 px-4 hover:bg-zinc-50 dark:hover:bg-primary/10 text-zinc-100 dark:hover:!text-blue-300 rounded-lg transition-colors duration-200 capitalize "
                      >

                        <div className="flex items-center gap-2">
                          <DiscordSvg size="16" fill={isHover ? '#8ec5ff' : undefined} />
                          <span className="text-sm font-medium">{item.label}</span>
                        </div>
                        {item.external && <ExternalLink className="w-4 h-4" />}
                      </Button>
                    )
                  : (

                      <Link
                        key={item.label}
                        to={item.href}
                      >

                        <Button
                          variant="custom"
                          key={item.label}
                          className="flex w-full items-center justify-between py-2 px-4 hover:bg-zinc-50 dark:hover:bg-primary/10 text-zinc-100 dark:hover:!text-blue-300 rounded-lg transition-colors duration-200 capitalize"
                        >
                          <div className="flex gap-2 items-center w-full">
                            {item.icon}
                            <span className="text-sm font-medium">{item.label}</span>
                          </div>
                          {item.value && (
                            <span className={cls('text-sm ', textClass)}>
                              {item.value}
                            </span>
                          )}

                        </Button>
                      </Link>
                    );
              })}
              <Button
                variant="custom"
                onClick={async () => {
                  logoutAction();
                }}
                className="w-full flex items-center justify-between py-2 px-4 hover:bg-zinc-50 dark:hover:bg-red-900/10 text-red-300 rounded-lg transition-colors duration-200"
              >
                <div className="flex items-center gap-2  ">
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium ">Logout</span>
                </div>
              </Button>

              {user?.premium?.plan?.name?.toLowerCase() === 'free' && (
                <>
                  <Separator />
                  <Link to="/subscription" className="pt-2">
                    <RainbowButton className="w-full">
                      Upgrade Plan
                    </RainbowButton>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <Dialog open={cropModalOpen} onOpenChange={setCropModalOpen}>
        <DialogContent className="sm:max-w-[90vw] md:max-w-[70vw] lg:max-w-[600px] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Adjust Image</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4">
            <div className="w-full" style={{ display: 'flex', justifyContent: 'center' }}>
              {imageToCrop && (
                <ReactCrop
                  crop={crop}
                  onChange={c => setCrop({ ...c })}
                  aspect={1}
                  circularCrop
                  keepSelection
                >
                  <img
                    ref={imgRef}
                    src={imageToCrop}
                    alt="Crop preview"
                    className="max-h-[calc(80vh-180px)]"
                    style={{
                      maxWidth: '100%',
                      objectFit: 'contain',
                      maxHeight: '500px',
                    }}
                    onLoad={onImageLoad}
                  />
                </ReactCrop>
              )}
            </div>
            <div className="flex justify-end gap-2 w-full">
              <Button
                variant="outline"
                className="text-white"
                onClick={() => {
                  setCropModalOpen(false);
                  setImageToCrop(null);
                }}
              >
                Cancel
              </Button>
              <Button className="text-white" onClick={handleCropComplete}>Confirm</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
