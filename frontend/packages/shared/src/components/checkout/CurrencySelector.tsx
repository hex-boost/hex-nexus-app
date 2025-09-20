import type { Currency } from '@/hooks/useMembershipPrices/useMembershipPrices.ts';
import { Label } from '@/components/ui/label.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';

export function CurrencySelector({ selectedCurrency, onCurrencyChange }: {
  selectedCurrency: Currency;
  onCurrencyChange: (value: Currency) => void;
}) {
  return (
    <div className="flex flex-col items-start space-y-2">
      <Label htmlFor="currency-select" className="text-gray-400">Currency:</Label>
      <Select value={selectedCurrency} onValueChange={(value: string) => onCurrencyChange(value as Currency)}>
        <SelectTrigger id="currency-select" className="w-[100px]">
          <SelectValue placeholder="Currency" />
        </SelectTrigger>
        <SelectContent>
          {(['USD', 'EUR', 'BRL'] as Currency[]).map(currency => (
            <SelectItem key={currency} value={currency}>{currency}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
