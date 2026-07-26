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
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const res = await getAppSetting('homeCardImages');
      if (res.success && res.value) {
        setImages(res.value);
      }
      const res2 = await getAppSetting('founderImages');
      if (res2.success && res2.value) {
        setFounderImages(res2.value || []);
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
      if (res.success && res2.success) {
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

          <Card className="border-none shadow-sm rounded-[2rem] bg-slate-900 p-8 text-white relative overflow-hidden">
            <ShieldCheck className="absolute top-0 right-0 h-32 w-32 text-white/5 -mr-8 -mt-8" />
            <CardTitle className="text-lg font-bold mb-4 flex items-center">
              Security Gate
            </CardTitle>
            <p className="text-xs text-slate-400 font-medium mb-6 leading-relaxed">
              All administrative actions are encrypted and logged for security auditing. 2FA is active for all super-admin roles.
            </p>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 h-12 rounded-xl font-bold">
              Backup Now
            </Button>
          </Card>
        </div>
      </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
