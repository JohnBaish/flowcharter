import { GripVertical, Menu, Plus, Printer, Trash2, X, type LucideProps } from 'lucide-react';

const STROKE_WIDTH = 2.75;

function withStroke(Icon: React.ComponentType<LucideProps>) {
  return function StrokedIcon(props: LucideProps) {
    return <Icon strokeWidth={STROKE_WIDTH} {...props} />;
  };
}

export const IconGrip = withStroke(GripVertical);
export const IconPlus = withStroke(Plus);
export const IconTrash = withStroke(Trash2);
export const IconPrint = withStroke(Printer);
export const IconMenu = withStroke(Menu);
export const IconClose = withStroke(X);
