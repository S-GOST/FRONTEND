import { formatId } from '../utils/formatIds';

export const FormattedId = ({ entity, value, className = "" }: {
  entity: string;
  value: number | string | null | undefined;
  className?: string;
}) => {
  // ✅ Convierte undefined a null para que coincida con el tipo esperado por formatId
  const formatted = formatId(entity, value ?? null);

  return (
    <span className={`font-mono text-sm font-semibold tracking-wide ${className}`}>
      {formatted}
    </span>
  );
};