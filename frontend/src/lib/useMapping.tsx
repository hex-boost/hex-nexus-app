import type { Server } from '@/types/types.ts';
import bronzeIcon from '@/assets/league_of_legends_bronze.svg';
import challengerIcon from '@/assets/league_of_legends_challenger.svg';
import diamondIcon from '@/assets/league_of_legends_diamond.svg';
import emeraldIcon from '@/assets/league_of_legends_emerald.svg';
import goldIcon from '@/assets/league_of_legends_gold.svg';
import grandmasterIcon from '@/assets/league_of_legends_grandmaster.svg';
import ironIcon from '@/assets/league_of_legends_iron.svg';
import masterIcon from '@/assets/league_of_legends_master.svg';
import platinumIcon from '@/assets/league_of_legends_platinum.svg';
import silverIcon from '@/assets/league_of_legends_silver.svg';
import unrankedIcon from '@/assets/league_of_legends_unranked.svg';
import nexusIcon from '@/assets/logo-hex-boost.svg';
import { LolIcon, ValorantIcon } from './icons';

export function useMapping() {
  const getStatusColor = (status: 'Available' | 'Rented') => {
    switch (status) {
      case 'Available':
        return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400';
      case 'Rented':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
    }
  };
  const getRankColor = (tier: string) => {
    switch (tier?.toLowerCase() || '') {
      case 'iron':
      case 'bronze':
        return 'text-zinc-600 dark:text-zinc-400';
      case 'silver':
        return 'text-zinc-400 dark:text-zinc-300';
      case 'gold':
        return 'text-amber-500 dark:text-amber-400';
      case 'platinum':
        return 'text-cyan-500 dark:text-cyan-400';
      case 'diamond':
        return 'text-blue-500 dark:text-blue-400';
      case 'master':
        return 'text-purple-500 dark:text-purple-400';
      case 'grandmaster':
        return 'text-red-500 dark:text-red-400';
      case 'challenger':
        return 'text-yellow-500 dark:text-yellow-400';
      default:
        return 'text-zinc-600 dark:text-zinc-400';
    }
  };
  function getEloIcon(rank: string) {
    const icons: Record<string, string> = {
      iron: ironIcon,
      bronze: bronzeIcon,
      silver: silverIcon,
      gold: goldIcon,
      emerald: emeraldIcon,
      platinum: platinumIcon,
      diamond: diamondIcon,
      master: masterIcon,
      grandmaster: grandmasterIcon,
      challenger: challengerIcon,
      unranked: unrankedIcon,
    };

    return icons[rank?.toLowerCase() || 'unranked'] || unrankedIcon; // Default to iron if not found
  }

  const getSkinRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Common':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
      case 'Epic':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400';
      case 'Legendary':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400';
      case 'Ultimate':
        return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
      case 'Mythic':
        return 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400';
      default:
        return 'bg-zinc-100 dark:bg-zinc-900/30 text-zinc-600 dark:text-zinc-400';
    }
  };
  const getRegionIcon = (region: Server | 'any') => {
    switch (region) {
      case 'any':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill-rule="evenodd" className="fill-foreground" clip-rule="evenodd" d="M23.98 4C12.94 4 4 12.96 4 24s8.94 20 19.98 20C35.04 44 44 35.04 44 24S35.04 4 23.98 4Zm13.86 12h-5.9c-.64-2.5-1.56-4.9-2.76-7.12A16.06 16.06 0 0 1 37.84 16ZM24 8.08c1.66 2.4 2.96 5.06 3.82 7.92h-7.64c.86-2.86 2.16-5.52 3.82-7.92ZM8.52 28C8.2 26.72 8 25.38 8 24s.2-2.72.52-4h6.76c-.16 1.32-.28 2.64-.28 4 0 1.36.12 2.68.28 4H8.52Zm1.64 4h5.9c.64 2.5 1.56 4.9 2.76 7.12-3.68-1.26-6.74-3.8-8.66-7.12Zm5.9-16h-5.9c1.92-3.32 4.98-5.86 8.66-7.12-1.2 2.22-2.12 4.62-2.76 7.12ZM24 39.92c-1.66-2.4-2.96-5.06-3.82-7.92h7.64c-.86 2.86-2.16 5.52-3.82 7.92ZM28.68 28h-9.36c-.18-1.32-.32-2.64-.32-4 0-1.36.14-2.7.32-4h9.36c.18 1.3.32 2.64.32 4 0 1.36-.14 2.68-.32 4Zm.5 11.12c1.2-2.22 2.12-4.62 2.76-7.12h5.9a16.06 16.06 0 0 1-8.66 7.12ZM32.72 28c.16-1.32.28-2.64.28-4 0-1.36-.12-2.68-.28-4h6.76c.32 1.28.52 2.62.52 4s-.2 2.72-.52 4h-6.76Z"></path></svg>

        );
      case 'NA1':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
            <path
              className="fill-background"
              d="M61.333 32C61.333 48.2 48.2 61.333 32 61.333S2.667 48.2 2.667 32 15.8 2.667 32 2.667 61.333 15.8 61.333 32z"
            />
            <path
              className="fill-foreground"
              d="m25.394 33.509.555 6.441 3.281 3.376 4.24.617 2.804 3.451 3.881-2.881 2.437.42.908 2.83.631-5.138 1.285-3.831c2.296-1.936 3.444-3.012 3.444-3.229 0-.325.454-1.998-.216-1.493-.447.336-2.464 1.546-6.052 3.631l-.416-2.467-1.761 2.242 1.096-3.405-3.368-1.045-12.749.482z"
            />
            <path
              className="fill-foreground"
              d="m26.08 32.001-4.717-6.127-4.095-1.015-6.7 2.112 1.454-2.112.551-2.863h-2.005l.572-2.833 2.707-1.483 8.392 2.349 10.267.831 6.687-.315 1.853-1.674.787 1.989-3.943 3.981.908 2.131 5.612 4.252.743-7.248 2.97 1.126.379 1.87 2.243-.684 2.831 4.563-5.866 2.438-3.798 2.558-2.079-3.099-2.304-.445-13.45-.301z"
            />
          </svg>
        );
      case 'EUW1':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
            <path
              className="fill-background"
              d="M61.333 32C61.333 48.2 48.2 61.333 32 61.333S2.667 48.2 2.667 32 15.8 2.667 32 2.667 61.333 15.8 61.333 32z"
            />
            <path
              className="fill-foreground"
              d="m13.271 41.195-.428 10.061 4.907 2.481 5.763-1.035 2.344-3.024-.593-2.213 6.265-6.271 2.712.585 4.203-2.085 9.171 7.021 2.445 4.54 1.069-4.54-7.5-7.021v-2.953l2.944-2.188 2.412.517 1.075-3.071-2.445-.911-2.555.911-2.815-4.001 4.328-2.436-2.944-6.037-2.213.651-2.972-2.033 1.437 2.545-.935.676h-4.705l-2.712 2.337.895 1.267-6.567 5.512-2.344-.727L20.205 32l4.06 2.029 2.051 4.776-2.051 2.389-8.644-1.5zm5.612-13.099 7.911-1.94.731-3.529-3.268-2.404V18.37l-3.279-2.797 1.416-3.667-2.375.427V9.921L17.88 14.11l2.139 2.648 2.375 4.844-2.375 1.025-.641 2.3h3.016zm-6.216-3.429 4.379-1.264-.709-3.013.709-2.837-4.379 1.973.776 2.556-2.644 1.997z"
            />
          </svg>
        );
      case 'OC1':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
            <path
              className="fill-background"
              d="M61.333 32C61.333 48.2 48.2 61.333 32 61.333S2.667 48.2 2.667 32 15.8 2.667 32 2.667 61.333 15.8 61.333 32z"
            />
            <path
              className="fill-foreground"
              d="M12.667 24.667v9.599h5.887l6.317-2.265 3.055 4.437 4.075 3.464h3.615l5.92-9.664-1.209-4.649-2.6-3.215-2.111-6.28-3.615 4.559-2.171-2.247.947-2.312h-3.676l-4.785 2.312zm27.354 22.666.452 2.479 4.101-3.649 2.741-2.653h1.629l2.159-4.027-2.641-4.233v4.652l-1.147 1.24-1.015 1.389z"
            />
          </svg>
        );
      case 'EUN1':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
            <path
              className="fill-background"
              d="M32 61.333C48.2 61.333 61.333 48.2 61.333 32S48.2 2.667 32 2.667 2.667 15.8 2.667 32 15.8 61.333 32 61.333z"
            />
            <path
              className="fill-foreground"
              d="M30.767 8h3.498l-.637 3.194 1.877 5.049 2.139 6.12-6.877 3.85-1.794-2.863 2.549-6.319-2.549-.788-.971 4.271-2.281 1.849-.587 8.203-2.122 2.463-1.131-5.82-3.359 2.768-1.781-.635-.74-4.976 4.009-3.79 3.89-8.712 6.868-3.865zm.754 23.674.584-3.614 3.4-.85v4.464l2.525 1.199 3.357 4.682 6.612 4.475-4.311 4.206-3.652-2.449-6.609 7.234L32.715 56l-8.731-9.764 2.408-4.509-3.383-.735.974-4.146 5.729-3.027 1.808-2.144z"
            />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
            <path
              fill-rule="evenodd"
              className="fill-foreground"
              clip-rule="evenodd"
              d="M23.98 4C12.94 4 4 12.96 4 24s8.94 20 19.98 20C35.04 44 44 35.04 44 24S35.04 4 23.98 4Zm13.86 12h-5.9c-.64-2.5-1.56-4.9-2.76-7.12A16.06 16.06 0 0 1 37.84 16ZM24 8.08c1.66 2.4 2.96 5.06 3.82 7.92h-7.64c.86-2.86 2.16-5.52 3.82-7.92ZM8.52 28C8.2 26.72 8 25.38 8 24s.2-2.72.52-4h6.76c-.16 1.32-.28 2.64-.28 4 0 1.36.12 2.68.28 4H8.52Zm1.64 4h5.9c.64 2.5 1.56 4.9 2.76 7.12-3.68-1.26-6.74-3.8-8.66-7.12Zm5.9-16h-5.9c1.92-3.32 4.98-5.86 8.66-7.12-1.2 2.22-2.12 4.62-2.76 7.12ZM24 39.92c-1.66-2.4-2.96-5.06-3.82-7.92h7.64c-.86 2.86-2.16 5.52-3.82 7.92ZM28.68 28h-9.36c-.18-1.32-.32-2.64-.32-4 0-1.36.14-2.7.32-4h9.36c.18 1.3.32 2.64.32 4 0 1.36-.14 2.68-.32 4Zm.5 11.12c1.2-2.22 2.12-4.62 2.76-7.12h5.9a16.06 16.06 0 0 1-8.66 7.12ZM32.72 28c.16-1.32.28-2.64.28-4 0-1.36-.12-2.68-.28-4h6.76c.32 1.28.52 2.62.52 4s-.2 2.72-.52 4h-6.76Z"
            >
            </path>
          </svg>
        );
    }
  };

  const getCompanyIcon = (company: string) => {
    // In a real app, you would use actual company icons
    if (company === 'Boost Royal') {
      return `data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBwgHBgkIBwgKCgkLDRYPDQwMDRsUFRAWIB0iIiAdHx8kKDQsJCYxJx8fLT0tMTU3Ojo6GCs/RD84QzQ5OjcBCgoKDQwNGg8PGjclHyU3Nzc3NzcyNzc3Nzc3LjU3ODc3Nzc3Njc3NzcvMzU1Nzc0NTQ3NzU3NzQ3MDcyNzc1Nf/AABEIABwAHAMBEQACEQEDEQH/xAAXAAADAQAAAAAAAAAAAAAAAAADBQYE/8QAKRAAAgECBQMCBwAAAAAAAAAAAQIDAAQFBhETIRIxQVHhFDJDUmFxgf/EABkBAAMBAQEAAAAAAAAAAAAAAAEDBAIFBv/EACYRAAICAAQEBwAAAAAAAAAAAAABAgMEERIhMUHR8AUTUWFxseH/2gAMAwEAAhEDEQA/ABotcts9sHRKw2APGlYbAaFTil5gE2IXHwGHXF2E69mMv066a6eNapitUkjN1nl1ufoS2ZM1TNY2F3gofYMgeWQj5WH0mHj1/Pgnmn1UrU1Pv3OVi8dJwjOnhz6Pv4KrCsdhxG6soraB9u6tmn3SeFKkAp+wTz/O+tS2VOCbfJlteKVkoqK2az/CgCcVNmUii8sVvrGe0kZlSZChK9wDVCnpaYLYKyDg+YmwvItpYSs0V7cskg6ZYZApSVfRhp7jxTJ4uUluiCvw6Fb2k+o5y/lu1wMyi0kleJ3LpHIQdong9J015Gnf7RSLb3ZxH0YaFGel7fQ+C8VNmUGCMCns0aEArDAHQUtgCAVlsB//2Q==`;
    } else {
      return nexusIcon;
    }
  };
  const getGameIcon = (game: 'lol' | 'valorant', props?: { size?: number; className?: string }) => {
    if (game === 'lol') {
      return <LolIcon {...props} />;
    } else {
      return <ValorantIcon />;
    }
  };
  return {
    getRegionIcon,
    getCompanyIcon,
    getEloIcon,
    getRankColor,
    getGameIcon,
    getStatusColor,
    getSkinRarityColor,
  };
}
