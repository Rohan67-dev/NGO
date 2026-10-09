import { useQuery } from '@tanstack/react-query';
import { axiosClient } from '../api/axiosClient';
import { SiteInfo } from '../types';

/** NGO name and contact details from the backend configuration (app.ngo.* in application.yml). */
export const useSiteInfo = () =>
  useQuery<SiteInfo>({
    queryKey: ['site-info'],
    queryFn: async () => (await axiosClient.get('/site/info')).data.data,
    staleTime: Infinity,
  });
