import React from 'react';
import {
  Link as RouterLink,
  useNavigate,
  useLocation,
  useParams as useRouterParams,
  useSearchParams as useRouterSearchParams,
  LinkProps as RouterLinkProps,
} from 'react-router-dom';

export interface NextLinkProps extends Omit<RouterLinkProps, 'to'> {
  href: string;
  to?: string;
  children: React.ReactNode;
}

export const Link = React.forwardRef<HTMLAnchorElement, NextLinkProps>(
  ({ href, to, children, ...props }, ref) => {
    return (
      <RouterLink ref={ref} to={to || href} {...props}>
        {children}
      </RouterLink>
    );
  }
);

Link.displayName = 'NextCompatLink';

export default Link;

export function useRouter() {
  const navigate = useNavigate();
  return {
    push: (url: string, _options?: any) => navigate(url),
    replace: (url: string, _options?: any) => navigate(url, { replace: true }),
    back: () => navigate(-1),
    forward: () => navigate(1),
    refresh: () => window.location.reload(),
    prefetch: () => {},
  };
}

export function usePathname() {
  const location = useLocation();
  return location.pathname;
}

export function useParams<T = Record<string, string | undefined>>(): T {
  return useRouterParams() as unknown as T;
}

export function useSearchParams() {
  const [searchParams] = useRouterSearchParams();
  return searchParams;
}

export function notFound() {
  throw new Error('Not found');
}
