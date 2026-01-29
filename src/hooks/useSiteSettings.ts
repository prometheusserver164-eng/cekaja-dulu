import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BrandingSettings {
  logo_url: string | null;
  favicon_url: string | null;
  site_name: string;
  tagline: string;
}

export interface SocialLinks {
  instagram: string;
  twitter: string;
  facebook: string;
  email: string;
  youtube: string;
  tiktok: string;
}

export interface FooterSettings {
  about_text: string;
  copyright_year: string;
}

export interface SiteSettings {
  branding: BrandingSettings;
  social_links: SocialLinks;
  footer: FooterSettings;
}

const defaultSettings: SiteSettings = {
  branding: {
    logo_url: null,
    favicon_url: null,
    site_name: 'CekLagi',
    tagline: 'Sebelum Beli, Cek Lagi!',
  },
  social_links: {
    instagram: '',
    twitter: '',
    facebook: '',
    email: '',
    youtube: '',
    tiktok: '',
  },
  footer: {
    about_text: 'Platform agregator review produk e-commerce Indonesia. Bantu kamu belanja online lebih cerdas dengan analisis review dari berbagai marketplace.',
    copyright_year: '2024',
  },
};

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value');

      if (error) throw error;

      if (data) {
        const newSettings = { ...defaultSettings };
        data.forEach((row) => {
          const key = row.key as keyof SiteSettings;
          if (key in newSettings) {
            newSettings[key] = row.value as any;
          }
        });
        setSettings(newSettings);
      }
    } catch (error) {
      console.error('Error fetching site settings:', error);
    } finally {
      setLoading(false);
    }
  };

  return { settings, loading, refetch: fetchSettings };
}

export function useAdminSettings() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value');

      if (error) throw error;

      if (data) {
        const newSettings = { ...defaultSettings };
        data.forEach((row) => {
          const key = row.key as keyof SiteSettings;
          if (key in newSettings) {
            newSettings[key] = row.value as any;
          }
        });
        setSettings(newSettings);
      }
    } catch (error) {
      console.error('Error fetching site settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (key: keyof SiteSettings, value: any) => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('site_settings')
        .update({ 
          value: value,
          updated_by: user?.id 
        })
        .eq('key', key);

      if (error) throw error;

      setSettings(prev => ({
        ...prev,
        [key]: value,
      }));

      return { success: true };
    } catch (error) {
      console.error('Error updating settings:', error);
      return { success: false, error };
    } finally {
      setSaving(false);
    }
  };

  return { settings, loading, saving, updateSettings, refetch: fetchSettings };
}
