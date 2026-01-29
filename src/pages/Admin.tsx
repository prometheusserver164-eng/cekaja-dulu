import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, Image, Link2, Save, Shield, Loader2, 
  Instagram, Twitter, Facebook, Mail, Youtube, Globe
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAdmin } from '@/hooks/useAdmin';
import { useAdminSettings, BrandingSettings, SocialLinks, FooterSettings } from '@/hooks/useSiteSettings';
import { SEOHead } from '@/components/SEOHead';

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { settings, loading: settingsLoading, saving, updateSettings } = useAdminSettings();

  const [branding, setBranding] = useState<BrandingSettings>(settings.branding);
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(settings.social_links);
  const [footer, setFooter] = useState<FooterSettings>(settings.footer);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/');
      toast({
        title: 'Akses Ditolak',
        description: 'Kamu tidak memiliki izin untuk mengakses halaman ini.',
        variant: 'destructive',
      });
    }
  }, [isAdmin, adminLoading, navigate, toast]);

  useEffect(() => {
    if (!settingsLoading) {
      setBranding(settings.branding);
      setSocialLinks(settings.social_links);
      setFooter(settings.footer);
    }
  }, [settings, settingsLoading]);

  const handleSaveBranding = async () => {
    const result = await updateSettings('branding', branding);
    if (result.success) {
      toast({ title: 'Berhasil', description: 'Pengaturan branding berhasil disimpan.' });
    } else {
      toast({ title: 'Gagal', description: 'Gagal menyimpan pengaturan.', variant: 'destructive' });
    }
  };

  const handleSaveSocialLinks = async () => {
    const result = await updateSettings('social_links', socialLinks);
    if (result.success) {
      toast({ title: 'Berhasil', description: 'Link sosial media berhasil disimpan.' });
    } else {
      toast({ title: 'Gagal', description: 'Gagal menyimpan link sosial media.', variant: 'destructive' });
    }
  };

  const handleSaveFooter = async () => {
    const result = await updateSettings('footer', footer);
    if (result.success) {
      toast({ title: 'Berhasil', description: 'Pengaturan footer berhasil disimpan.' });
    } else {
      toast({ title: 'Gagal', description: 'Gagal menyimpan pengaturan footer.', variant: 'destructive' });
    }
  };

  if (adminLoading || settingsLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead 
        title="Admin Panel - CekDulu"
        description="Panel admin untuk mengelola pengaturan situs CekDulu"
        url="https://cekdulu.id/admin"
      />
      <Navbar />
      <main className="flex-1 py-8">
        <div className="container mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-3xl font-bold">Admin Panel</h1>
            </div>
            <p className="text-muted-foreground">
              Kelola pengaturan situs, branding, dan link sosial media.
            </p>
          </div>

          <Tabs defaultValue="branding" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="branding" className="gap-2">
                <Image className="h-4 w-4" />
                Branding
              </TabsTrigger>
              <TabsTrigger value="social" className="gap-2">
                <Link2 className="h-4 w-4" />
                Sosial Media
              </TabsTrigger>
              <TabsTrigger value="footer" className="gap-2">
                <Settings className="h-4 w-4" />
                Footer
              </TabsTrigger>
            </TabsList>

            {/* Branding Tab */}
            <TabsContent value="branding">
              <Card>
                <CardHeader>
                  <CardTitle>Pengaturan Branding</CardTitle>
                  <CardDescription>
                    Atur logo, favicon, dan identitas situs.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="site_name">Nama Situs</Label>
                    <Input
                      id="site_name"
                      value={branding.site_name}
                      onChange={(e) => setBranding({ ...branding, site_name: e.target.value })}
                      placeholder="CekDulu"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tagline">Tagline</Label>
                    <Input
                      id="tagline"
                      value={branding.tagline}
                      onChange={(e) => setBranding({ ...branding, tagline: e.target.value })}
                      placeholder="Sebelum Beli, Cek Dulu!"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="logo_url">URL Logo</Label>
                    <Input
                      id="logo_url"
                      value={branding.logo_url || ''}
                      onChange={(e) => setBranding({ ...branding, logo_url: e.target.value || null })}
                      placeholder="https://example.com/logo.png"
                    />
                    <p className="text-xs text-muted-foreground">
                      Masukkan URL gambar logo. Biarkan kosong untuk menggunakan logo default.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="favicon_url">URL Favicon</Label>
                    <Input
                      id="favicon_url"
                      value={branding.favicon_url || ''}
                      onChange={(e) => setBranding({ ...branding, favicon_url: e.target.value || null })}
                      placeholder="https://example.com/favicon.ico"
                    />
                    <p className="text-xs text-muted-foreground">
                      Masukkan URL favicon. Biarkan kosong untuk menggunakan favicon default.
                    </p>
                  </div>
                  <Button onClick={handleSaveBranding} disabled={saving} className="w-full">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Simpan Branding
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Social Links Tab */}
            <TabsContent value="social">
              <Card>
                <CardHeader>
                  <CardTitle>Link Sosial Media</CardTitle>
                  <CardDescription>
                    Atur link ke akun sosial media yang akan ditampilkan di footer.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="instagram" className="flex items-center gap-2">
                        <Instagram className="h-4 w-4" />
                        Instagram
                      </Label>
                      <Input
                        id="instagram"
                        value={socialLinks.instagram}
                        onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                        placeholder="https://instagram.com/username"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="twitter" className="flex items-center gap-2">
                        <Twitter className="h-4 w-4" />
                        Twitter / X
                      </Label>
                      <Input
                        id="twitter"
                        value={socialLinks.twitter}
                        onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })}
                        placeholder="https://twitter.com/username"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="facebook" className="flex items-center gap-2">
                        <Facebook className="h-4 w-4" />
                        Facebook
                      </Label>
                      <Input
                        id="facebook"
                        value={socialLinks.facebook}
                        onChange={(e) => setSocialLinks({ ...socialLinks, facebook: e.target.value })}
                        placeholder="https://facebook.com/pagename"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="youtube" className="flex items-center gap-2">
                        <Youtube className="h-4 w-4" />
                        YouTube
                      </Label>
                      <Input
                        id="youtube"
                        value={socialLinks.youtube}
                        onChange={(e) => setSocialLinks({ ...socialLinks, youtube: e.target.value })}
                        placeholder="https://youtube.com/@channel"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tiktok" className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        TikTok
                      </Label>
                      <Input
                        id="tiktok"
                        value={socialLinks.tiktok}
                        onChange={(e) => setSocialLinks({ ...socialLinks, tiktok: e.target.value })}
                        placeholder="https://tiktok.com/@username"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={socialLinks.email}
                        onChange={(e) => setSocialLinks({ ...socialLinks, email: e.target.value })}
                        placeholder="contact@example.com"
                      />
                    </div>
                  </div>
                  <Button onClick={handleSaveSocialLinks} disabled={saving} className="w-full">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Simpan Link Sosial Media
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Footer Tab */}
            <TabsContent value="footer">
              <Card>
                <CardHeader>
                  <CardTitle>Pengaturan Footer</CardTitle>
                  <CardDescription>
                    Atur teks dan informasi yang ditampilkan di footer.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="about_text">Teks Tentang</Label>
                    <Textarea
                      id="about_text"
                      value={footer.about_text}
                      onChange={(e) => setFooter({ ...footer, about_text: e.target.value })}
                      placeholder="Deskripsi tentang situs..."
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="copyright_year">Tahun Copyright</Label>
                    <Input
                      id="copyright_year"
                      value={footer.copyright_year}
                      onChange={(e) => setFooter({ ...footer, copyright_year: e.target.value })}
                      placeholder="2024"
                    />
                  </div>
                  <Button onClick={handleSaveFooter} disabled={saving} className="w-full">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Simpan Footer
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Admin;
