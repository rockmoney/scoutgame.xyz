import TextField from '@mui/material/TextField';
import { forwardRef } from 'react';

import { FieldWrapper } from 'components/common/form/fields/FieldWrapper';
import type { ControlFieldProps, FieldProps } from 'components/common/form/interfaces';

type Props = ControlFieldProps & FieldProps & { multiline?: boolean; rows?: number };

export const TextInputField = forwardRef<HTMLDivElement, Props>(
  (
    {
      label,
      endAdornment,
      fieldWrapperSx,
      iconLabel,
      inline,
      error,
      description,
      multiline = false,
      required,
      ...inputProps
    },
    ref
  ) => {
    return (
      <FieldWrapper
        sx={fieldWrapperSx}
        endAdornment={endAdornment}
        description={description}
        required={required}
        label={label}
        inline={inline}
        iconLabel={iconLabel}
      >
        <TextField fullWidth required={required} error={!!error} multiline={multiline} {...inputProps} ref={ref} />
      </FieldWrapper>
    );
  }
);
