import { type FieldValues, type Control, type Path, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ControlledInputProps<T extends FieldValues>
  extends Omit<React.ComponentProps<'input'>, 'name'> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  description?: string;
}

export function ControlledInput<T extends FieldValues>({
  control,
  name,
  label,
  description,
  ...props
}: ControlledInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => (
        <div className="space-y-2">
          {label && <Label htmlFor={name}>{label}</Label>}
          <Input id={name} {...field} {...props} />
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
          {error && (
            <p className="text-sm text-destructive">{error.message}</p>
          )}
        </div>
      )}
    />
  );
}
