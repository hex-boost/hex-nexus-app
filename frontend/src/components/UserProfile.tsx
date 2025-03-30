import type { UserType } from '@/types/types.ts';
import type React from 'react';
import type { Crop } from 'react-image-crop';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip.tsx';
import { useProfileAvatar } from '@/hooks/useProfileAvatar.ts';
import { useMutation } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Check, HelpCircle, LogOut, MoveUpRight, Pencil, Trophy, X } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import ReactCrop from 'react-image-crop';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import 'react-image-crop/dist/ReactCrop.css';

type MenuItem = {
  label: string;
  value?: string;
  href: string;
  icon?: React.ReactNode;
  external?: boolean;
};

export type UserProfileProps = {
  user: UserType;
  logoutAction: () => void;
  updateAction: () => void;
};

export function UserProfile({
  user,
  logoutAction,
  updateAction,
}: UserProfileProps) {
  const { updateUserAvatarFromBase64 } = useProfileAvatar();
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
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
    mutationKey: ['update-avatar', user.id],
    mutationFn: async () => {
      return toast.promise(updateUserAvatarFromBase64(previewAvatar!, user.id), {
        loading: 'Updating avatar',
        success: 'Avatar updated succesfully',
        error: 'An unexpected error occurred',
        finally: () => {
          updateAction();
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
  const menuItems: MenuItem[] = [
    {
      label: 'Membership',
      value: 'Free Trial',
      href: '#',
      icon: <Trophy className="w-4 h-4" />,
      external: false,
    },
    {
      label: 'Help',
      href: '#',
      icon: <HelpCircle className="w-4 h-4" />,
    },
  ];

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

                          src={previewAvatar || import.meta.env.VITE_BACKEND_URL + user.avatar.url}
                          alt={user.username}
                        />

                        <AvatarFallback><Skeleton className="w-[72px] h-[72px]" /></AvatarFallback>
                      </Avatar>
                      {isDragActive && (
                        <div className="absolute inset-0 bg-primary/20 rounded-full flex items-center justify-center">
                          <p className="text-white font-medium text-sm">Solte a imagem aqui</p>
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
                                Editar avatar
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
                                  Confirmar
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
                                  Cancelar
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
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{user.username}</h2>
                <p className="text-zinc-600 dark:text-zinc-400">Free Trial</p>
              </div>
            </div>
            <Separator className="mb-6" />
            <div className="space-y-2 px-6">
              {menuItems.map(item =>
                (
                  <Link
                    key={item.label}
                    to={item.href}
                    className="flex items-center justify-between p-2 hover:bg-zinc-50 dark:hover:bg-primary/10 text-zinc-100 dark:hover:!text-blue-300 rounded-lg transition-colors duration-200"
                  >
                    <div className="flex items-center gap-2">
                      {item.icon}
                      <span className="text-sm font-medium  ">{item.label}</span>
                    </div>
                    <div className="flex items-center">
                      {item.value && (
                        <span className="text-sm text-zinc-500 dark:text-zinc-400 mr-2">
                          {item.value}
                        </span>
                      )}
                      {item.external && <MoveUpRight className="w-4 h-4" />}
                    </div>
                  </Link>
                ),
              )}
              <button
                onClick={async () => {
                  logoutAction();
                }}
                type="button"
                className="w-full flex cursor-pointer items-center justify-between p-2 hover:bg-zinc-50 dark:hover:bg-primary/10 text-zinc-100 dark:hover:!text-blue-300 rounded-lg transition-colors duration-200"
              >
                <div className="flex items-center gap-2">
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium ">Logout</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
      <Dialog open={cropModalOpen} onOpenChange={setCropModalOpen}>
        <DialogContent className="sm:max-w-[90vw] md:max-w-[70vw] lg:max-w-[600px] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Ajustar Imagem</DialogTitle>
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
                Cancelar
              </Button>
              <Button className="text-white" onClick={handleCropComplete}>Confirmar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
