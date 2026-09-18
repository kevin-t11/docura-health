/** Expose shared Hugeicons components with consistent props. */
import { HugeiconsIcon, type HugeiconsIconProps, type IconSvgElement } from '@hugeicons/react';
import {
  Alert02Icon,
  AlertCircleIcon,
  Tick02Icon,
  LinkSquare02Icon,
  FileImageIcon,
  Csv02Icon,
  Copy01Icon,
  Pdf02Icon,
  Doc02Icon,
  Link01Icon,
  Loading03Icon,
  Mic01Icon,
  PauseIcon,
  PlayIcon,
  RefreshIcon,
  Upload04Icon,
  Cancel01Icon,
  ArrowRight02Icon,
  Message02Icon,
  Notification01Icon,
  InformationCircleIcon,
  CircleIcon,
  File02Icon,
  Add01Icon,
  Search01Icon,
  TimelineEventIcon,
  BookOpen01Icon,
  SparklesIcon,
  Download04Icon,
  Shield01Icon,
  GridViewIcon,
  Menu01Icon
} from '@hugeicons/core-free-icons';

type AppIconProps = Omit<HugeiconsIconProps, 'icon'>;
export type AppIcon = (props: AppIconProps) => React.JSX.Element;

function createIcon(icon: IconSvgElement): AppIcon {
  return function IconComponent(props) {
    return <HugeiconsIcon icon={icon} size={18} strokeWidth={1.65} aria-hidden="true" {...props} />;
  };
}

export const AlertTriangle = createIcon(Alert02Icon);
export const AlertCircle = createIcon(AlertCircleIcon);
export const Check = createIcon(Tick02Icon);
export const Copy = createIcon(Copy01Icon);
export const ExternalLink = createIcon(LinkSquare02Icon);
export const FileImage = createIcon(FileImageIcon);
export const Link = createIcon(Link01Icon);
export const LoaderCircle = createIcon(Loading03Icon);
export const Mic = createIcon(Mic01Icon);
export const Pause = createIcon(PauseIcon);
export const Play = createIcon(PlayIcon);
export const RotateCcw = createIcon(RefreshIcon);
export const Upload = createIcon(Upload04Icon);
export const X = createIcon(Cancel01Icon);
export const ArrowRight = createIcon(ArrowRight02Icon);
export const MessageSquareText = createIcon(Message02Icon);
export const Bell = createIcon(Notification01Icon);
export const Info = createIcon(InformationCircleIcon);
export const Circle = createIcon(CircleIcon);
export const File = createIcon(File02Icon);
export const Plus = createIcon(Add01Icon);
export const Search = createIcon(Search01Icon);
export const TimelineIcon = createIcon(TimelineEventIcon);
export const Book = createIcon(BookOpen01Icon);
export const Sparkle = createIcon(SparklesIcon);
export const Download = createIcon(Download04Icon);
export const Shield = createIcon(Shield01Icon);
export const Grid = createIcon(GridViewIcon);
export const Menu = createIcon(Menu01Icon);

/** Match supported document formats to their Hugeicons file icon. */
export function DocumentIcon({
  name,
  mimeType,
  ...props
}: AppIconProps & { name: string; mimeType?: string }) {
  const extension = name.split('.').pop()?.toLowerCase();
  let icon = File02Icon;

  if (mimeType?.startsWith('audio/') || ['mp3', 'm4a', 'wav', 'webm'].includes(extension ?? '')) {
    icon = Mic01Icon;
  } else if (extension === 'pdf' || mimeType === 'application/pdf') {
    icon = Pdf02Icon;
  } else if (extension === 'csv' || mimeType === 'text/csv') {
    icon = Csv02Icon;
  } else if (
    extension === 'doc' ||
    extension === 'docx' ||
    mimeType === 'application/msword' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    icon = Doc02Icon;
  }

  return <HugeiconsIcon icon={icon} size={18} strokeWidth={1.65} aria-hidden="true" {...props} />;
}
