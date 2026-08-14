'use client';

import { Activity, Clock, ShieldCheck, Database, Server, Image as ImageIcon, Save, RefreshCw, Upload, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from 'react';
import { getAppSetting, setAppSetting } from '@/app/actions/admin-actions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const MOCK_LOGS = [
  { action: "Admin approved Dr. Ramesh Mishra", user: "Admin Team", time: "10 mins ago", type: "Approval" },
  { action: "SaaS limits updated for Dr. Priya Patel", user: "Admin Team", time: "45 mins ago", type: "Billing" },
  { action: "Patient account DOC-USR-77382 suspended", user: "System Auto-Flag", time: "2 hours ago", type: "Security" },
  { action: "Database backup completed successfully", user: "System", time: "5 hours ago", type: "Database" },
  { action: "New sub-admin added: Manager Rohit", user: "Super Admin", time: "1 day ago", type: "Access" },
];

export default function PlatformSettings() {
  const { toast } = useToast();
  const [images, setImages] = useState({
    card0: '',
    card1: '',
    card2: '',
    card3: ''
  });
  const [founderImages, setFounderImages] = useState<string[]>([]);
  const [homeBanners, setHomeBanners] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const res = await getAppSetting('homeCardImages');
      if (res.success && 'value' in res && res.value) {
        setImages(res.value);
      }
      const res2 = await getAppSetting('founderImages');
      if (res2.success && 'value' in res2 && res2.value) {
        setFounderImages(res2.value);
      }
      const res3 = await getAppSetting('homeBanners');
      if (res3.success && 'value' in res3 && res3.value) {
        setHomeBanners((res3.value || []).map((b: any) => typeof b === 'string' ? { imageUrl: b } : b));
      }
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await setAppSetting('homeCardImages', images);
      const res2 = await setAppSetting('founderImages', founderImages);
      const res3 = await setAppSetting('homeBanners', homeBanners);
      if (res.success && res2.success && res3.success) {
        toast({ title: 'Success', description: 'Settings updated successfully.' });
      } else {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to update settings.' });
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
    setIsSaving(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Optional: add loading state per image if needed

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        // Compress and resize image
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Convert to WebP for better compression (fallback to jpeg)
        const dataUrl = canvas.toDataURL('image/webp', 0.8);
        setImages(prev => ({ ...prev, [key]: dataUrl }));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFounderImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const dataUrl = canvas.toDataURL('image/webp', 0.8);
          setFounderImages(prev => [...prev, dataUrl]);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Platform Settings</h1>
        <p className="text-slate-500 font-medium">Manage system configurations and audit logs.</p>
      </div>

      <Tabs defaultValue="ui" className="w-full">
        <TabsList className="bg-slate-200 p-1 rounded-xl mb-8">
          <TabsTrigger value="ui" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:text-blue-600 px-6">App UI Settings</TabsTrigger>
          <TabsTrigger value="banners" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:text-blue-600 px-6">Home Banners</TabsTrigger>
          <TabsTrigger value="founder" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:text-blue-600 px-6">Founder Page</TabsTrigger>
          <TabsTrigger value="logs" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:text-blue-600 px-6">Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="ui" className="space-y-6">
          <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden max-w-4xl">
            <CardHeader className="p-8 border-b border-slate-50">
              <CardTitle className="text-xl font-bold text-slate-800 flex items-center">
                <ImageIcon className="h-6 w-6 mr-3 text-blue-500" /> Home Page Feature Cards
              </CardTitle>
              <p className="text-sm text-slate-500 font-medium mt-2">
                Paste direct image URLs (e.g. Cloudinary, Imgur links) for the 4 quick action cards shown on the user's home screen. Leave blank to show default icons.
              </p>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              {isLoading ? (
                <div className="py-12 flex justify-center"><RefreshCw className="animate-spin h-8 w-8 text-blue-500" /></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { key: 'card0', label: 'Card 1: Book Appointment' },
                    { key: 'card1', label: 'Card 2: My Appointment' },
                    { key: 'card2', label: 'Card 3: Physiotherapist' },
                    { key: 'card3', label: 'Card 4: Add Patient' }
                  ].map((card, idx) => (
                    <div key={card.key} className="space-y-3 p-6 bg-slate-50 rounded-3xl border border-slate-100 relative">
                      <label className="text-xs font-black uppercase tracking-widest text-slate-500">{card.label}</label>
                      <div className="flex space-x-2">
                        <Input
                          placeholder="https://... or Upload"
                          value={(images as any)[card.key] || ''}
                          onChange={(e) => setImages({ ...images, [card.key]: e.target.value })}
                          className="bg-white border-slate-200 h-12 rounded-xl font-medium flex-1"
                        />
                        <div className="relative">
                          <Button type="button" variant="outline" className="h-12 w-12 p-0 rounded-xl bg-white border-slate-200">
                            <Upload className="h-5 w-5 text-slate-500" />
                          </Button>
                          <input 
                            type="file" 
                            accept="image/*"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={(e) => handleImageUpload(e, card.key)}
                          />
                        </div>
                      </div>
                      {(images as any)[card.key] && (
                        <div className="mt-2 h-24 w-24 rounded-2xl overflow-hidden border border-slate-200 bg-white relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={(images as any)[card.key]} alt={card.label} className="object-cover w-full h-full" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="pt-4 flex justify-end">
                <Button onClick={handleSave} disabled={isSaving || isLoading} className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl">
                  {isSaving ? <RefreshCw className="animate-spin h-5 w-5 mr-2" /> : <Save className="h-5 w-5 mr-2" />} Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="founder" className="space-y-6">
          <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden max-w-4xl">
            <CardHeader className="p-8 border-b border-slate-50">
              <CardTitle className="text-xl font-bold text-slate-800 flex items-center">
                <ImageIcon className="h-6 w-6 mr-3 text-purple-500" /> Founder Images Gallery
              </CardTitle>
              <p className="text-sm text-slate-500 font-medium mt-2">
                Upload multiple images of the founder. These will be displayed as a gallery on the "About Founder" page.
              </p>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              {isLoading ? (
                <div className="py-12 flex justify-center"><RefreshCw className="animate-spin h-8 w-8 text-blue-500" /></div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="relative inline-block">
                      <Button type="button" className="h-12 px-6 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl flex items-center">
                        <Upload className="h-5 w-5 mr-2" /> Upload Images
                      </Button>
                      <input 
                        type="file" 
                        accept="image/*"
                        multiple
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={handleFounderImageUpload}
                      />
                    </div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Select multiple files at once</p>
                  </div>
                  
                  {founderImages.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                      {founderImages.map((img, idx) => (
                        <div key={idx} className="relative group rounded-2xl overflow-hidden border border-slate-200 aspect-square">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img} alt={`Founder ${idx}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button 
                              type="button" 
                              variant="destructive" 
                              size="icon"
                              className="rounded-full h-10 w-10"
                              onClick={() => setFounderImages(prev => prev.filter((_, i) => i !== idx))}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="pt-4 flex justify-end">
                <Button onClick={handleSave} disabled={isSaving || isLoading} className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl">
                  {isSaving ? <RefreshCw className="animate-spin h-5 w-5 mr-2" /> : <Save className="h-5 w-5 mr-2" />} Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="banners" className="space-y-6">
          <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden max-w-4xl">
            <CardHeader className="p-8 border-b border-slate-50">
              <CardTitle className="text-xl font-bold text-slate-800 flex items-center">
                <ImageIcon className="h-6 w-6 mr-3 text-blue-500" /> Home Page Banners
              </CardTitle>
              <p className="text-sm text-slate-500 font-medium mt-2">
                Upload images for the home page auto-slider banner.
                <br />
                <span className="text-blue-500 font-bold">Note:</span> Recommended Aspect Ratio is 3:1 (e.g. 1200x400) or 21:9 for Mobile viewing.
              </p>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              {isLoading ? (
                <div className="py-12 flex justify-center"><RefreshCw className="animate-spin h-8 w-8 text-blue-500" /></div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-center w-full">
                    <Button type="button" onClick={() => setHomeBanners(prev => [...prev, { imageUrl: '', bgColor: 'bg-blue-600', heading: 'New Banner', paragraph: '', ctaText: 'Book Now', ctaLink: '/doctors' }])} className="w-full h-14 bg-slate-100 hover:bg-slate-200 text-blue-600 font-bold border-2 border-dashed border-slate-300 rounded-3xl">
                      + Add New Banner
                    </Button>
                  </div>

                  {homeBanners.length > 0 && (
                    <div className="space-y-6 mt-6">
                      {homeBanners.map((banner, idx) => (
                        <div key={idx} className="p-6 rounded-3xl border border-slate-200 bg-slate-50 relative">
                          <Button 
                            type="button" 
                            variant="destructive" 
                            size="icon"
                            className="absolute top-4 right-4 rounded-full h-8 w-8 z-20"
                            onClick={() => setHomeBanners(prev => prev.filter((_, i) => i !== idx))}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <h4 className="font-bold text-slate-700 mb-4 uppercase text-xs tracking-widest">Banner {idx + 1}</h4>
                          
                          {/* Banner Live Preview */}
                          <div className="mb-6 w-full max-w-sm mx-auto">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block text-center">Live Preview (Mobile Size)</label>
                            <div className={cn("w-full aspect-[21/9] rounded-[2rem] overflow-hidden shadow-lg border border-slate-100 relative flex items-center px-5 justify-between", banner.bgColor && banner.bgColor.includes('gradient') ? banner.bgColor : "bg-gradient-to-r from-blue-500 to-blue-600")}>
                              <div className="relative z-10 flex flex-col justify-center h-full w-[60%] text-white space-y-1">
                                <h2 className="text-sm font-black tracking-tight leading-tight">{banner.heading || 'Welcome to O-Parchee'}</h2>
                                {banner.paragraph && <p className="text-[9px] font-medium opacity-90 line-clamp-2 leading-relaxed">{banner.paragraph}</p>}
                                {banner.ctaText && (
                                  <div className="bg-white text-slate-900 text-[9px] font-black px-2.5 py-1 rounded-full self-start mt-1">
                                    {banner.ctaText}
                                  </div>
                                )}
                              </div>
                              {banner.imageUrl && (
                                <div className="h-14 w-14 bg-white rounded-2xl p-1.5 flex items-center justify-center shrink-0 shadow-lg z-10">
                                  <img src={banner.imageUrl} alt={`Banner ${idx}`} className="w-full h-full object-contain" />
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-xs font-black text-slate-500 uppercase">Background Gradient</label>
                              <div className="flex gap-2 flex-wrap">
                                {[
                                  'bg-gradient-to-r from-blue-500 to-blue-600',
                                  'bg-gradient-to-r from-indigo-500 to-purple-600',
                                  'bg-gradient-to-r from-emerald-500 to-teal-600',
                                  'bg-gradient-to-r from-rose-500 to-pink-600',
                                  'bg-gradient-to-r from-amber-500 to-orange-600',
                                  'bg-gradient-to-r from-slate-800 to-slate-900',
                                ].map((bg, i) => (
                                  <button
                                    key={i}
                                    type="button"
                                    onClick={() => { const newArr = [...homeBanners]; newArr[idx].bgColor = bg; setHomeBanners(newArr); }}
                                    className={cn("w-10 h-10 rounded-full border-2", banner.bgColor === bg ? "border-slate-800 scale-110 shadow-md" : "border-transparent", bg)}
                                  />
                                ))}
                              </div>
                            </div>
                              {/* Template type removed as per request */}
                            <div className="space-y-2">
                              <label className="text-xs font-black text-slate-500 uppercase">Heading</label>
                              <Input value={banner.heading || ''} onChange={e => { const newArr = [...homeBanners]; newArr[idx].heading = e.target.value; setHomeBanners(newArr); }} placeholder="Banner Heading" className="bg-white" />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <label className="text-xs font-black text-slate-500 uppercase">Paragraph text</label>
                              <Input value={banner.paragraph || ''} onChange={e => { const newArr = [...homeBanners]; newArr[idx].paragraph = e.target.value; setHomeBanners(newArr); }} placeholder="Brief description..." className="bg-white" />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-black text-slate-500 uppercase">CTA Button Text</label>
                              <Input value={banner.ctaText || ''} onChange={e => { const newArr = [...homeBanners]; newArr[idx].ctaText = e.target.value; setHomeBanners(newArr); }} placeholder="e.g. Book Now" className="bg-white" />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-black text-slate-500 uppercase">CTA Button Link</label>
                              <Input value={banner.ctaLink || ''} onChange={e => { const newArr = [...homeBanners]; newArr[idx].ctaLink = e.target.value; setHomeBanners(newArr); }} placeholder="e.g. /doctors" className="bg-white" />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <label className="text-xs font-black text-slate-500 uppercase">Showcase Image Upload</label>
                              <div className="flex gap-4 items-center">
                                {banner.imageUrl ? (
                                  <div className="h-20 w-32 rounded-xl border border-slate-200 overflow-hidden relative bg-white">
                                    <img src={banner.imageUrl} alt="Preview" className="object-cover w-full h-full" />
                                  </div>
                                ) : (
                                  <div className="h-20 w-32 rounded-xl border border-slate-200 border-dashed flex items-center justify-center text-slate-400 bg-white text-xs">No Image</div>
                                )}
                                <div className="relative">
                                  <Button type="button" variant="outline" className="h-10 bg-white">Upload Image</Button>
                                  <input 
                                    type="file" 
                                    accept="image/*"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      const reader = new FileReader();
                                      reader.onload = (event) => {
                                        const img = new window.Image();
                                        img.onload = () => {
                                          const canvas = document.createElement('canvas');
                                          let width = img.width; let height = img.height;
                                          if (width > 800) { height *= 800/width; width = 800; }
                                          canvas.width = width; canvas.height = height;
                                          const ctx = canvas.getContext('2d');
                                          ctx?.drawImage(img, 0, 0, width, height);
                                          const dataUrl = canvas.toDataURL('image/webp', 0.8);
                                          const newArr = [...homeBanners];
                                          newArr[idx].imageUrl = dataUrl;
                                          setHomeBanners(newArr);
                                        };
                                        img.src = event.target?.result as string;
                                      };
                                      reader.readAsDataURL(file);
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="pt-4 flex justify-end">
                <Button onClick={handleSave} disabled={isSaving || isLoading} className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl">
                  {isSaving ? <RefreshCw className="animate-spin h-5 w-5 mr-2" /> : <Save className="h-5 w-5 mr-2" />} Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">

      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 space-y-4">
          <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
            <CardHeader className="p-8 border-b border-slate-50">
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center">
                <Activity className="h-5 w-5 mr-3 text-blue-500" /> Recent System Logs
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-50">
                {MOCK_LOGS.map((log, idx) => (
                  <div key={idx} className="p-8 hover:bg-slate-50/50 transition-colors flex items-start justify-between">
                    <div className="flex space-x-6">
                      <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 mb-1">{log.action}</p>
                        <div className="flex items-center space-x-4 text-xs font-bold text-slate-400">
                          <span>By: {log.user}</span>
                          <span className="h-1 w-1 bg-slate-200 rounded-full" />
                          <span>{log.time}</span>
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-blue-50 text-blue-600 border-none px-3 py-1 font-bold text-[9px] uppercase tracking-widest">
                      {log.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm rounded-[2rem] bg-white p-8">
            <CardTitle className="text-lg font-bold text-slate-800 mb-6 flex items-center">
              <Server className="h-5 w-5 mr-3 text-purple-500" /> System Status
            </CardTitle>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-500">API Server</span>
                <span className="flex items-center text-xs font-bold text-green-500"><div className="h-2 w-2 bg-green-500 rounded-full mr-2" /> Online</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-500">Database</span>
                <span className="flex items-center text-xs font-bold text-green-500"><div className="h-2 w-2 bg-green-500 rounded-full mr-2" /> Connected</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-500">Redis Cache</span>
                <span className="flex items-center text-xs font-bold text-green-500"><div className="h-2 w-2 bg-green-500 rounded-full mr-2" /> Active</span>
              </div>
              <div className="pt-4 border-t border-slate-50">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">Version Control</p>
                <p className="text-xs font-bold text-slate-600">v2.4.1-stable (build 902)</p>
              </div>
            </div>
          </Card>

        </div>
      </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}


