import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, Image, Link2, Save, Shield, Loader2, 
  Instagram, Twitter, Facebook, Mail, Youtube, Globe,
  Upload, X, CheckCircle
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
import { supabase } from '@/integrations/supabase/client';

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { settings, loading: settingsLoading, saving, updateSettings } = useAdminSettings();

  const [branding, setBranding] = useState<BrandingSettings>(settings.branding);
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(settings.social_links);
  const [footer, setFooter] = useState<FooterSettings>(settings.footer);
  const [uploading, setUploading] = useState<'logo' | 'favicon' | null>(null);
  const [dragOver, setDragOver] = useState<'logo' | 'favicon' | null>(null);

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

  const uploadFile = async (file: File, type: 'logo' | 'favicon') => {
    setUploading(type);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}-${Date.now()}.${fileExt}`;
      const filePath = `branding/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('site-assets')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('site-assets')
        .getPublicUrl(filePath);

      if (type === 'logo') {
        setBranding(prev => ({ ...prev, logo_url: publicUrl }));
      } else {
        setBranding(prev => ({ ...prev, favicon_url: publicUrl }));
      }

      toast({
        title: 'Upload Berhasil',
        description: `${type === 'logo' ? 'Logo' : 'Favicon'} berhasil diupload.`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Gagal',
        description: 'Gagal mengupload file. Silakan coba lagi.',
        variant: 'destructive',
      });
    } finally {
      setUploading(null);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent, type: 'logo' | 'favicon') => {
    e.preventDefault();
    setDragOver(null);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      uploadFile(file, type);
    } else {
      toast({
        title: 'File Tidak Valid',
        description: 'Harap upload file gambar (PNG, JPG, ICO, dll).',
        variant: 'destructive',
      });
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon') => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file, type);
    }
  };

  const clearImage = (type: 'logo' | 'favicon') => {
    if (type === 'logo') {
      setBranding(prev => ({ ...prev, logo_url: null }));
    } else {
      setBranding(prev => ({ ...prev, favicon_url: null }));
    }
  };

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

  const DropZone = ({ type, currentUrl }: { type: 'logo' | 'favicon'; currentUrl: string | null }) => (
    <div
      className={`
        relative border-2 border-dashed rounded-xl p-4 transition-all duration-200
        ${dragOver === type 
          ? 'border-primary bg-primary/5' 
          : 'border-border hover:border-primary/50'
        }
      `}
      onDragOver={(e) => { e.preventDefault(); setDragOver(type); }}
      onDragLeave={() => setDragOver(null)}
      onDrop={(e) => handleDrop(e, type)}
    >
      {currentUrl ? (
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
            <img 
              src={currentUrl} 
              alt={type} 
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{type === 'logo' ? 'Logo' : 'Favicon'} aktif</p>
            <p className="text-xs text-muted-foreground truncate">{currentUrl.split('/').pop()}</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => clearImage(type)}
            className="text-destructive hover:bg-destructive/10 flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center py-4 sm:py-6 cursor-pointer">
          {uploading === type ? (
            <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 text-primary animate-spin mb-2" />
          ) : (
            <Upload className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground mb-2" />
          )}
          <span className="text-sm font-medium text-center">
            {uploading === type ? 'Mengupload...' : 'Drag & drop atau klik untuk upload'}
          </span>
          <span className="text-xs text-muted-foreground mt-1">
            PNG, JPG, ICO (max 2MB)
          </span>
          <input 
            type="file" 
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileInput(e, type)}
            disabled={uploading !== null}
          />
        </label>
      )}
    </div>
  );

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
      <main className="flex-1 py-6 sm:py-8">
        <div className="container mx-auto max-w-4xl px-4">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold">Admin Panel</h1>
            </div>
            <p className="text-muted-foreground text-sm sm:text-base">
              Kelola pengaturan situs, branding, dan link sosial media.
            </p>
          </div>

          <Tabs defaultValue="branding" className="space-y-4 sm:space-y-6">
            <TabsList className="grid w-full grid-cols-3 h-auto">
              <TabsTrigger value="branding" className="gap-1 sm:gap-2 py-2 sm:py-2.5 text-xs sm:text-sm">
                <Image className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Branding</span>
                <span className="xs:hidden">Logo</span>
              </TabsTrigger>
              <TabsTrigger value="social" className="gap-1 sm:gap-2 py-2 sm:py-2.5 text-xs sm:text-sm">
                <Link2 className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Sosial Media</span>
                <span className="xs:hidden">Sosmed</span>
              </TabsTrigger>
              <TabsTrigger value="footer" className="gap-1 sm:gap-2 py-2 sm:py-2.5 text-xs sm:text-sm">
                <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                Footer
              </TabsTrigger>
            </TabsList>

            {/* Branding Tab */}
            <TabsContent value="branding">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg sm:text-xl">Pengaturan Branding</CardTitle>
                  <CardDescription className="text-sm">
                    Atur logo, favicon, dan identitas situs.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6">
                  <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Image className="h-4 w-4" />
                        Logo
                      </Label>
                      <DropZone type="logo" currentUrl={branding.logo_url} />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Image className="h-4 w-4" />
                        Favicon
                      </Label>
                      <DropZone type="favicon" currentUrl={branding.favicon_url} />
                    </div>
                  </div>
                  
                  <div className="grid gap-4 sm:grid-cols-2">
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
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg sm:text-xl">Link Sosial Media</CardTitle>
                  <CardDescription className="text-sm">
                    Atur link ke akun sosial media yang akan ditampilkan di footer.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
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
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg sm:text-xl">Pengaturan Footer</CardTitle>
                  <CardDescription className="text-sm">
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
