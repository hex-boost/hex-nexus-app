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
import logoBoostRoyal from '@/assets/logo-boost-royal.svg';
import nexusIcon from '@/assets/logo-hex-boost.svg';
import logoTurboBoost from '@/assets/logo-turbo-boost.png';
import { EarthLock } from 'lucide-react';
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
        return 'text-stone-700 dark:text-stone-500';
      case 'bronze':
        return 'text-amber-700 dark:text-amber-700';
      case 'silver':
        return 'text-slate-400 dark:text-slate-300';
      case 'gold':
        return 'text-yellow-500 dark:text-yellow-400';
      case 'emerald':
        return 'text-emerald-500 dark:text-emerald-400';
      case 'platinum':
        return 'text-sky-400 dark:text-sky-300';
      case 'diamond':
        return 'text-blue-400 dark:text-blue-300';
      case 'master':
        return 'text-fuchsia-500 dark:text-fuchsia-400';
      case 'grandmaster':
        return 'text-red-600 dark:text-red-500';
      case 'challenger':
        return 'text-amber-400 dark:text-amber-300';
      default:
        return 'text-stone-600 dark:text-stone-400';
    }
  };
  const getRankBackground = (tier: string) => {
    switch (tier?.toLowerCase() || '') {
      case 'iron':
        return 'bg-gradient-to-r from-[#43464B] to-[#71797E]';
      case 'bronze':
        return 'bg-gradient-to-r from-[#8E5524] to-[#C27C3A]';
      case 'silver':
        return 'bg-gradient-to-r from-[#71797E] to-[#C0C0C0]';
      case 'gold':
        return 'bg-gradient-to-r from-[#B38728] to-[#FFDC73]';
      case 'emerald':
        return 'bg-gradient-to-r from-[#046C4E] to-[#34D399]';
      case 'platinum':
        return 'bg-gradient-to-r from-[#328DA8] to-[#7ADBF0]';
      case 'diamond':
        return 'bg-gradient-to-r from-[#4F8FCA] to-[#7EB3FF]';
      case 'master':
        return 'bg-gradient-to-r from-[#8C34A8] to-[#D17FF9]';
      case 'grandmaster':
        return 'bg-gradient-to-r from-[#B3392C] to-[#FF6A56]';
      case 'challenger':
        return 'bg-gradient-to-r from-[#0A5D7A] to-[#4DB9E3]';
      default:
        return 'bg-gradient-to-r from-gray-700 to-gray-500';
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

    return icons[rank?.toLowerCase() || 'unranked'] || unrankedIcon;
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
      case 'TR1':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
            <path fill="#e30a17" d="M61.333 32C61.333 48.2 48.2 61.333 32 61.333S2.667 48.2 2.667 32 15.8 2.667 32 2.667 61.333 15.8 61.333 32z"></path>
            <path fill="#fff" d="M42.092 32.055c0 6.764-5.546 12.247-12.388 12.247s-12.388-5.483-12.388-12.247 5.546-12.247 12.388-12.247 12.388 5.483 12.388 12.247z"></path>
            <path fill="#e30a17" d="M42.711 32.055c0 5.411-4.437 9.797-9.911 9.797s-9.911-4.386-9.911-9.797c0-5.411 4.437-9.797 9.911-9.797s9.911 4.386 9.911 9.797z"></path>
            <path fill="#fff" d="m39.511 32.055 11.205 3.6-6.925-9.424v11.648l6.925-9.424z"></path>
          </svg>
        );

      case 'PH2':
        return (
          <svg viewBox="0 0 48 48">
            <path fill="#0038A8" fill-rule="evenodd" d="M45.954 25.429H3.214v-8.655C6.204 8.174 14.381 2 24 2c12.15 0 22 9.85 22 22 0 .48-.015.956-.046 1.429Z" clip-rule="evenodd"></path>
            <path fill="#CE1126" fill-rule="evenodd" d="M46 24c0 12.15-9.85 22-22 22S2 36.15 2 24h44Z" clip-rule="evenodd"></path>
            <path fill="#fff" fill-rule="evenodd" d="M6.028 36.714 28.342 24 6.085 11.25A21.9 21.9 0 0 0 2 24.02a21.9 21.9 0 0 0 4.028 12.693Z" clip-rule="evenodd"></path>
            <path fill="#FCD116" d="m11.769 17.755-.38.38.188 2.879a2.91 2.91 0 0 0-.19.019l-.346-2.627-.31.31.466 2.348a2.91 2.91 0 0 0-1.055.437l-1.33-1.99h-.438l1.613 2.102c-.051.039-.1.08-.148.122l-1.903-2.17H7.4v.538l2.17 1.902a2.94 2.94 0 0 0-.122.149L7.344 20.54v.439l1.991 1.33a2.91 2.91 0 0 0-.438 1.055l-2.348-.467-.31.31 2.627.346a2.928 2.928 0 0 0-.018.19l-2.88-.188-.38.38.38.38 2.88-.188c.004.064.01.128.018.19l-2.627.346.31.31 2.348-.466c.076.384.227.74.438 1.055l-1.99 1.33v.438l2.102-1.613c.039.051.08.1.121.148l-2.17 1.903v.537h.538l1.903-2.17c.048.043.097.083.148.122L8.374 28.36h.438l1.33-1.991c.315.21.671.362 1.056.438l-.468 2.348.31.31.347-2.627c.063.008.126.014.19.018l-.188 2.88.38.38.38-.38-.189-2.88c.064-.004.128-.01.19-.018l.347 2.627.31-.31-.467-2.348a2.91 2.91 0 0 0 1.055-.438l1.33 1.99h.439l-1.613-2.102c.05-.039.1-.08.147-.121l1.903 2.17h.538v-.538l-2.17-1.903c.042-.048.083-.097.122-.148l2.102 1.613v-.438l-1.99-1.33a2.92 2.92 0 0 0 .437-1.056l2.348.468.31-.31-2.627-.347a2.91 2.91 0 0 0 .019-.19l2.879.188.38-.38-.38-.38-2.879.189a2.907 2.907 0 0 0-.019-.19l2.627-.347-.31-.31-2.348.467a2.91 2.91 0 0 0-.437-1.055l1.99-1.33v-.439l-2.102 1.613a2.96 2.96 0 0 0-.122-.147l2.17-1.903v-.538H15.6l-1.903 2.17a2.924 2.924 0 0 0-.148-.122l1.614-2.102h-.439l-1.33 1.99a2.91 2.91 0 0 0-1.055-.437l.467-2.348-.31-.31-.346 2.627a2.917 2.917 0 0 0-.19-.019l.188-2.879-.38-.38Z"></path>
          </svg>
        );
      case 'LA1':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
            <path
              className="fill-white/5"
              d="M61.333 32C61.333 48.2 48.2 61.333 32 61.333S2.667 48.2 2.667 32 15.8 2.667 32 2.667 61.333 15.8 61.333 32z"
            >
            </path>
            <path
              className="fill-foreground"
              d="m47.333 48.23-3.774-2.841 2.95-3.836v-3.694h3.938L54.214 32l-5.328-2.246-3.728 1.487v-2.344l-4.221 2.344-4.683-.658v-4.535h-4.255l1.455-4.99-5.539 2.915-3.11-2.915v-7.47l-5.015-1.381-7.036-2.063-.836 2.063c1.998 5.253 2.997 7.697 2.997 7.334s-.418-2.808-1.255-7.334l5.485 9.59 5.66 3.692 3.837.559 4.813 2.849 4.015 4.063 2.158-.888 1.31 3.891-2.847 4.845-.621 2.18 4.189 7.306 5.675 3.69v-5.755z"
            >
            </path>
          </svg>
        );
      case 'BR1':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
            <path fill="#009b3a" d="M32 61.333C48.2 61.333 61.333 48.2 61.333 32S48.2 2.667 32 2.667 2.667 15.8 2.667 32 15.8 61.333 32 61.333z"></path>
            <path fill="#fedf00" d="M4.459 30.774 31.37 48.07l26.911-17.296L31.37 13.478 4.459 30.774z"></path>
            <path fill="#002776" d="M31.371 42.196c6.267 0 11.348-5.114 11.348-11.422s-5.081-11.422-11.348-11.422-11.348 5.114-11.348 11.422 5.081 11.422 11.348 11.422z"></path>
            <path fill="#fff" d="M20.384 27.903a25.985 25.985 0 0 1 4.502-.392c6.656 0 12.727 2.523 17.319 6.672.181-.584.317-1.188.403-1.808a27.344 27.344 0 0 0-17.722-6.495c-1.323 0-2.624.094-3.897.275-.247.561-.45 1.145-.605 1.748z"></path>
          </svg>
        );
      case 'NA1':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
            <path
              className="fill-white/5"
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
              className="fill-white/5"
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
              className="fill-white/5"
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
              className="fill-white/5"
              d="M32 61.333C48.2 61.333 61.333 48.2 61.333 32S48.2 2.667 32 2.667 2.667 15.8 2.667 32 15.8 61.333 32 61.333z"
            />
            <path
              className="fill-foreground"
              d="M30.767 8h3.498l-.637 3.194 1.877 5.049 2.139 6.12-6.877 3.85-1.794-2.863 2.549-6.319-2.549-.788-.971 4.271-2.281 1.849-.587 8.203-2.122 2.463-1.131-5.82-3.359 2.768-1.781-.635-.74-4.976 4.009-3.79 3.89-8.712 6.868-3.865zm.754 23.674.584-3.614 3.4-.85v4.464l2.525 1.199 3.357 4.682 6.612 4.475-4.311 4.206-3.652-2.449-6.609 7.234L32.715 56l-8.731-9.764 2.408-4.509-3.383-.735.974-4.146 5.729-3.027 1.808-2.144z"
            />
          </svg>
        );
      case 'TH2':
        return (
          <svg viewBox="0 0 48 48">
            <path fill="#ED1C24" fill-rule="evenodd" d="M46 24c0 12.15-9.85 22-22 22S2 36.15 2 24 11.85 2 24 2s22 9.85 22 22Z" clip-rule="evenodd"></path>
            <path fill="#fff" fill-rule="evenodd" d="M7.82 38.907h32.36A21.921 21.921 0 0 0 46 24a21.923 21.923 0 0 0-5.935-15.03H7.935A21.923 21.923 0 0 0 2 24a21.921 21.921 0 0 0 5.82 14.907Z" clip-rule="evenodd"></path>
            <path fill="#241D4F" fill-rule="evenodd" d="M3.284 31.423h41.432A21.96 21.96 0 0 0 46 24a21.96 21.96 0 0 0-1.328-7.546H3.328A21.958 21.958 0 0 0 2 24c0 2.605.453 5.104 1.284 7.423Z" clip-rule="evenodd"></path>
          </svg>
        );
      case 'RU':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
            <path fill="#fff" d="M61.333 32.054H2.666v-.053c0-16.2 13.133-29.333 29.333-29.333s29.333 13.133 29.333 29.333v.053z"></path>
            <path fill="#d52b1e" d="M2.666 32.054h58.667C61.304 48.23 48.182 61.334 32 61.334S2.695 48.23 2.667 32.054z"></path>
            <path fill="#0039a6" d="M4.398 22.048h55.204a29.277 29.277 0 0 1 1.732 9.953 29.28 29.28 0 0 1-1.77 10.059H4.438a29.285 29.285 0 0 1-1.77-10.059c0-3.494.611-6.845 1.732-9.953z"></path>
          </svg>
        );
      case 'SG2':
        return (
          <svg viewBox="0 0 48 48">
            <path fill="#fff" fill-rule="evenodd" d="M24 46c12.15 0 22-9.85 22-22S36.15 2 24 2 2 11.85 2 24s9.85 22 22 22Z" clip-rule="evenodd"></path>
            <path fill="#ED2939" fill-rule="evenodd" d="M2 24h44a21.92 21.92 0 0 0-5.907-15H7.907A21.923 21.923 0 0 0 2 24Z" clip-rule="evenodd"></path>
            <path fill="#fff" fill-rule="evenodd" d="M45.997 24.36C45.805 36.344 36.03 46 24 46S2.195 36.344 2.003 24.36h43.994Zm-29.306-7.505c0 3.118-2.556 5.645-5.709 5.645-3.153 0-5.709-2.527-5.709-5.645a5.633 5.633 0 0 1 2.855-4.887 5.766 5.766 0 0 1 5.709 0 5.633 5.633 0 0 1 2.854 4.887Z" clip-rule="evenodd"></path>
            <path fill="#ED2939" fill-rule="evenodd" d="M18.485 16.855c0 2.946-2.415 5.334-5.395 5.334-2.98 0-5.395-2.388-5.395-5.334 0-2.945 2.415-5.333 5.395-5.333 2.98 0 5.395 2.388 5.395 5.333Z" clip-rule="evenodd"></path>
            <path fill="#fff" fill-rule="evenodd" d="m11.689 16.992-.776-.588-.775.588.298-.948-.778-.585.96.002.295-.95.295.95.96-.003-.778.585.299.949Zm6.085 0-.776-.588-.775.588.299-.948-.778-.585.96.002.294-.95.295.95.96-.003-.778.585.299.949Zm-3.04-2.233-.775-.588-.775.588.298-.948-.778-.585.96.002.295-.95.294.95.96-.002-.777.585.298.948Zm-1.907 5.805-.775-.588-.775.588.298-.948-.778-.585.96.002.295-.95.294.95.96-.002-.777.585.298.948Zm3.808 0-.775-.588-.776.588.299-.948-.778-.585.96.002.294-.95.295.95.96-.002-.777.585.298.948Z" clip-rule="evenodd"></path>
          </svg>
        );
      case 'LA2':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
            <path className="fill-white/5" d="M61.333 32C61.333 48.2 48.2 61.333 32 61.333S2.667 48.2 2.667 32 15.8 2.667 32 2.667 61.333 15.8 61.333 32z"></path>
            <path fill="white" d="M32 54c0-.299-1.798-1.911-5.394-4.837l-1.68-14.117 1.68-3.698-.602-13.651.602-3.512v-3.123l2.356-.57.999 1.564 4.052 3.193 1.545 5.268 3.593 3.061-1.837 3.576 2.546 3.726L36.468 32l.846 3.046-4.195 2.006-1.121 4.434-.903 2.949.903 2.247-1.51 2.482 3.525 4.205c-1.343.72-2.014.93-2.014.631z"></path>
          </svg>
        );
      case 'VN2':
        return (
          <svg viewBox="0 0 48 48">
            <path fill="#DA251D" fill-rule="evenodd" d="M24 46c12.15 0 22-9.85 22-22S36.15 2 24 2 2 11.85 2 24s9.85 22 22 22Z" clip-rule="evenodd"></path>
            <path fill="#FF0" fill-rule="evenodd" d="M25.717 21.116h-4.378l2.19-6.652 2.188 6.652Zm1.349 4.1 2.185 6.638-5.723-4.102-5.723 4.102 2.185-6.639-.016-.011-5.703-4.088h18.514l-6.286 4.506.567-.407Z" clip-rule="evenodd"></path>
          </svg>
        );
      case 'JP1':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
            <path fill="#fff" d="M32 61.333C48.2 61.333 61.333 48.2 61.333 32S48.2 2.667 32 2.667 2.667 15.8 2.667 32 15.8 61.333 32 61.333z"></path>
            <path fill="#bc002d" d="M32 48.22c9.122 0 16.517-7.311 16.517-16.33S41.122 15.56 32 15.56s-16.517 7.311-16.517 16.33S22.878 48.22 32 48.22z"></path>
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
type CompanyIcon = string | typeof EarthLock;
const getCompanyIcon = (company: string): CompanyIcon => {
  if (company === 'boostroyal') {
    return logoBoostRoyal;
  }
  if (company === 'turboboost') {
    // Return an img tag string for PNGs to work with dangerouslySetInnerHTML
    return logoTurboBoost;
  }
  if (company === 'private') {
    return EarthLock; // This case needs to be handled differently if used with dangerouslySetInnerHTML
  }
  return nexusIcon; // Assuming nexusIcon is an SVG string or compatible
};
const getGameIcon = (game: 'lol' | 'valorant', props?: { size?: number; className?: string }) => {
  if (game === 'lol') {
    return <LolIcon {...props} />;
  } else {
    return <ValorantIcon />;
  }
};
const rangeBucket = (tuples: [number, any][]) => {
  // Return a function that takes a number and returns the corresponding value
  return (value: number): any => {
    for (let i = tuples.length - 1; i >= 0; i--) {
      const [k, v] = tuples[i];
      if (value >= k) {
        return v;
      }
    }
    // Default to first value if below all ranges
    return tuples[0][1];
  };
};
const kdaColorRange = rangeBucket([
  [0, '#828790'],
  [1.5, '#978D87'],
  [3.0, '#C4A889'],
  [4.5, '#DEAF78'],
  [6.5, '#E6A85F'],
  [8.5, '#FF9417'],
]);

const getKdaColor = (kda: number): string => {
  return kdaColorRange[kda];
};
const getFormattedServer = (server: Server): string => {
  switch (server) {
    case 'LA2':
      return 'LAS';
    case 'RU':
      return 'RU';
    case 'LA1':
      return 'LAN';
    case 'OC1':
      return 'OCE';
    case 'ME1':
      return 'MENA';
    case 'EUN1':
      return 'EUNE';
    default:
      return server ? server?.slice(0, server.length - 1) : 'N/A';
  }
};
function getWinrateColorClass(winRate: number) {
  let winRateColorClass = 'text-zinc-600 dark:text-muted-foreground';
  if (winRate > 55) {
    if (winRate >= 95) {
      winRateColorClass = 'text-blue-500 dark:text-blue-500 font-medium';
    } else if (winRate >= 85) {
      winRateColorClass = 'text-blue-400 dark:text-blue-400 font-medium';
    } else if (winRate >= 75) {
      winRateColorClass = 'text-blue-300 dark:text-blue-300 font-medium';
    } else if (winRate >= 65) {
      winRateColorClass = 'text-blue-200 dark:text-blue-200';
    } else {
      winRateColorClass = 'text-blue-100 dark:text-blue-100';
    }
  } else if (winRate < 40 && winRate > 0) {
    if (winRate < 30) {
      winRateColorClass = 'text-red-500 dark:text-red-400';
    } else if (winRate < 40) {
      winRateColorClass = 'text-red-300 dark:text-red-300';
    } else {
      winRateColorClass = 'text-red-100 dark:text-red-100';
    }
  }
  return winRateColorClass;
}
return {
  getRegionIcon,
  getCompanyIcon,
  getEloIcon,
  getRankColor,
  getGameIcon,
  getKdaColor,
  getStatusColor,
  getSkinRarityColor,
  getFormattedServer,
  getWinrateColorClass,
  getRankBackground,
};
}
