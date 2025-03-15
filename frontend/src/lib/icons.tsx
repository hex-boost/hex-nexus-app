
export const LolIcon = ({ size = 24, className = '' }: { size?: number; className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
    >
      <path d="M6.222 3 7 4.167v11.277L6.222 17h8.569l1.043-3H10.04V3H6.222ZM3.39 10.389A6.6 6.6 0 0 1 6 5.126v2.97a4.59 4.59 0 0 0-.61 2.293c0 .835.222 1.618.61 2.294v2.578l-.14.281a6.599 6.599 0 0 1-2.47-5.153Z"></path>
      <path d="M14.612 10.389c0 .97-.299 1.869-.81 2.611h2.274A6.613 6.613 0 0 0 11 3.853v2.033a4.613 4.613 0 0 1 3.612 4.503Z"></path>
    </svg>
  )
};
export const ValorantIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path fill="currentColor" d="M3.118 4.236 12.29 15.89c.035.044.004.109-.051.109H7.72a.065.065 0 0 1-.051-.025l-4.654-5.846A.068.068 0 0 1 3 10.087v-5.81c0-.063.079-.09.118-.041Zm7.761 7.684 6.004-7.617c.039-.05.117-.022.117.042v5.775c0 .016-.005.03-.015.043l-1.484 1.841a.066.066 0 0 1-.051.025h-4.52c-.055 0-.086-.066-.051-.11Z"></path></svg>
);
