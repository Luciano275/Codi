import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ForwardRefExoticComponent,
  type RefAttributes,
} from 'react';

const SPRITE_PATH = '/icons/sprite.svg';

export type IconName =
  | 'arrow-down'
  | 'arrow-left'
  | 'award'
  | 'badge-check'
  | 'ban'
  | 'bell'
  | 'book-open'
  | 'book-open-check'
  | 'box'
  | 'calendar-check-2'
  | 'camera'
  | 'check'
  | 'chevron-down'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-up'
  | 'circle-alert'
  | 'circle-check'
  | 'circle-gauge'
  | 'circle-question-mark'
  | 'clipboard-check'
  | 'clipboard-list'
  | 'clock-3'
  | 'code-xml'
  | 'crown'
  | 'dumbbell'
  | 'earth'
  | 'external-link'
  | 'eye'
  | 'eye-off'
  | 'file-code-corner'
  | 'file-text'
  | 'file-up'
  | 'files'
  | 'flag'
  | 'flag-triangle-right'
  | 'flame'
  | 'flask-conical'
  | 'gem'
  | 'gift'
  | 'grid-2x2'
  | 'info'
  | 'key-round'
  | 'layers'
  | 'layout-grid'
  | 'lightbulb'
  | 'loader-circle'
  | 'lock'
  | 'lock-keyhole'
  | 'log-out'
  | 'mail'
  | 'map'
  | 'medal'
  | 'menu'
  | 'move'
  | 'panel-bottom-close'
  | 'panel-bottom-open'
  | 'panel-left-open'
  | 'pen-line'
  | 'pencil'
  | 'play'
  | 'plus'
  | 'receipt-text'
  | 'rotate-ccw'
  | 'save'
  | 'search'
  | 'settings'
  | 'shield'
  | 'shield-check'
  | 'sparkles'
  | 'swords'
  | 'target'
  | 'terminal'
  | 'timer-reset'
  | 'trash-2'
  | 'tree-palm'
  | 'trending-up'
  | 'triangle-alert'
  | 'trophy'
  | 'user'
  | 'users-round'
  | 'x'
  | 'zap'
  | 'zoom-in';

export interface IconProps extends Omit<
  ComponentPropsWithoutRef<'svg'>,
  'children' | 'height' | 'width'
> {
  name: IconName;
  size?: number | string;
  width?: number | string;
  height?: number | string;
}

export const Icon = forwardRef<SVGSVGElement, IconProps>(function Icon(
  {
    name,
    size = 24,
    width,
    height,
    'aria-label': ariaLabel,
    'aria-hidden': ariaHidden,
    role,
    ...props
  },
  ref,
) {
  return (
    <svg
      ref={ref}
      width={width ?? size}
      height={height ?? size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      aria-hidden={ariaHidden ?? (ariaLabel ? undefined : true)}
      aria-label={ariaLabel}
      role={role ?? (ariaLabel ? 'img' : undefined)}
      {...props}
    >
      <use href={SPRITE_PATH + '#' + name} />
    </svg>
  );
});

export type IconComponent = ForwardRefExoticComponent<
  Omit<IconProps, 'name'> & RefAttributes<SVGSVGElement>
>;

function createIcon(name: IconName): IconComponent {
  return forwardRef<SVGSVGElement, Omit<IconProps, 'name'>>(function SpriteIcon(props, ref) {
    return <Icon ref={ref} name={name} {...props} />;
  });
}

export const AlertCircle = createIcon('circle-alert');
export const AlertTriangle = createIcon('triangle-alert');
export const ArrowDown = createIcon('arrow-down');
export const ArrowLeft = createIcon('arrow-left');
export const Award = createIcon('award');
export const BadgeCheck = createIcon('badge-check');
export const Ban = createIcon('ban');
export const Bell = createIcon('bell');
export const BookOpen = createIcon('book-open');
export const BookOpenCheck = createIcon('book-open-check');
export const Box = createIcon('box');
export const CalendarCheck2 = createIcon('calendar-check-2');
export const Camera = createIcon('camera');
export const Check = createIcon('check');
export const CheckCircle2 = createIcon('circle-check');
export const ChevronDown = createIcon('chevron-down');
export const ChevronLeft = createIcon('chevron-left');
export const ChevronRight = createIcon('chevron-right');
export const ChevronUp = createIcon('chevron-up');
export const CircleAlert = createIcon('circle-alert');
export const CircleCheck = createIcon('circle-check');
export const CircleGauge = createIcon('circle-gauge');
export const ClipboardCheck = createIcon('clipboard-check');
export const ClipboardList = createIcon('clipboard-list');
export const Clock3 = createIcon('clock-3');
export const Code2 = createIcon('code-xml');
export const Crown = createIcon('crown');
export const Dumbbell = createIcon('dumbbell');
export const Edit3 = createIcon('pen-line');
export const ExternalLink = createIcon('external-link');
export const Eye = createIcon('eye');
export const EyeOff = createIcon('eye-off');
export const FileCode2 = createIcon('file-code-corner');
export const FileText = createIcon('file-text');
export const FileUp = createIcon('file-up');
export const Files = createIcon('files');
export const Flag = createIcon('flag');
export const FlagTriangleRight = createIcon('flag-triangle-right');
export const Flame = createIcon('flame');
export const FlaskConical = createIcon('flask-conical');
export const Gem = createIcon('gem');
export const Gift = createIcon('gift');
export const Globe2 = createIcon('earth');
export const Grid2X2 = createIcon('grid-2x2');
export const HelpCircle = createIcon('circle-question-mark');
export const Info = createIcon('info');
export const KeyRound = createIcon('key-round');
export const Layers3 = createIcon('layers');
export const LayoutGrid = createIcon('layout-grid');
export const Lightbulb = createIcon('lightbulb');
export const Loader2 = createIcon('loader-circle');
export const Lock = createIcon('lock');
export const LockKeyhole = createIcon('lock-keyhole');
export const LogOut = createIcon('log-out');
export const Mail = createIcon('mail');
export const Map = createIcon('map');
export const Medal = createIcon('medal');
export const Menu = createIcon('menu');
export const Move = createIcon('move');
export const PanelBottomClose = createIcon('panel-bottom-close');
export const PanelBottomOpen = createIcon('panel-bottom-open');
export const PanelLeftOpen = createIcon('panel-left-open');
export const Pencil = createIcon('pencil');
export const Play = createIcon('play');
export const Plus = createIcon('plus');
export const ReceiptText = createIcon('receipt-text');
export const RotateCcw = createIcon('rotate-ccw');
export const Save = createIcon('save');
export const Search = createIcon('search');
export const Settings = createIcon('settings');
export const Shield = createIcon('shield');
export const ShieldCheck = createIcon('shield-check');
export const Sparkles = createIcon('sparkles');
export const Swords = createIcon('swords');
export const Target = createIcon('target');
export const Terminal = createIcon('terminal');
export const TimerReset = createIcon('timer-reset');
export const Trash2 = createIcon('trash-2');
export const TreePalm = createIcon('tree-palm');
export const TrendingUp = createIcon('trending-up');
export const TriangleAlert = createIcon('triangle-alert');
export const Trophy = createIcon('trophy');
export const User = createIcon('user');
export const UsersRound = createIcon('users-round');
export const X = createIcon('x');
export const Zap = createIcon('zap');
export const ZoomIn = createIcon('zoom-in');
