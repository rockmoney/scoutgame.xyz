import { ComponentProps, ReactNode } from 'react';
import styled from '@emotion/styled';
import MuiModal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import MuiDialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

type ModalSize = 'large' | 'fluid' | 'small' | string;

const defaultSize = '400px';

const ModalContainer = styled.div<{ size: ModalSize }>`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  max-width: ${({ size }) => size === 'large' ? '670px' : size === 'fluid' ? 'auto' : size === 'small' ? defaultSize : size};
  width: 100%;
  background-color: ${({ theme }) => theme.palette.background.paper};
  border-radius: ${({ theme }) => theme.spacing(1)};
  box-shadow: ${({ theme }) => theme.shadows[15]};
  padding: ${({ theme }) => theme.spacing(4)};
  max-height: calc(80vh - ${({ theme }) => theme.spacing(4)});
  overflow-y: auto;
`;

const ScrollableModalContainer = styled(ModalContainer)`
  display: flex;
  flex-direction: column;
  padding: ${({ theme }) => theme.spacing(4, 0)};
`;

const StyledDialogTitle = styled(MuiDialogTitle)`
  font-weight: 700;
  padding-left: 0;
  padding-right: 0;
  padding-top: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CloseButton = styled(IconButton)`
  padding: 0;
`;

const ScrollableContainer = styled.div`
  flex-grow: 1;
  overflow: auto;
`;

export type ModalProps = Omit<ComponentProps<typeof MuiModal>, 'children' | 'onClose' | 'title'> & {
  size?: ModalSize,
  children: any,
  title?: string | ReactNode,
  onClose: () => void
};

export function Modal ({ children, size = defaultSize, title, ...props }: ModalProps) {
  return (
    <MuiModal {...props}>
      <div>
        <ModalContainer size={size}>
          {title && <DialogTitle onClose={props.onClose}>{title}</DialogTitle>}
          {children}
        </ModalContainer>
      </div>
    </MuiModal>
  );
}

export function ScrollableModal ({ children, size = defaultSize, title, ...props }: ModalProps) {
  return (
    <MuiModal {...props}>
      <div>
        <ScrollableModalContainer size={size}>
          {title && <Box px={4}><DialogTitle>{title}</DialogTitle></Box>}
          <ScrollableContainer>{children}</ScrollableContainer>
        </ScrollableModalContainer>
      </div>
    </MuiModal>
  );
}

export function DialogTitle ({ children, onClose, sx }: { children: ReactNode, onClose?: () => void, sx?: any }) {
  return (
    <StyledDialogTitle sx={sx}>
      {children}
      {onClose && (
        <CloseButton onClick={onClose}>
          <CloseIcon color='secondary' />
        </CloseButton>
      )}
    </StyledDialogTitle>
  );
}

// TODO: add special theme for alert dialogs
export const Alert = Modal;

export default Modal;
