interface PageTransitionProps {
  children: React.ReactNode;
  animateTransform?: boolean;
}

export default function PageTransition({ children, animateTransform = true }: PageTransitionProps) {
  return (
    <div className={`h-full flex-1 ${animateTransform ? 'page-enter' : 'page-fade-enter'}`}>
      {children}
    </div>
  );
}
