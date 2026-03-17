'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { 
  PawPrint, Gauge, Plus, Trash2, Edit, Search, Filter, 
  Heart, Activity, DollarSign, TrendingUp, TrendingDown,
  Baby, Syringe, Utensils, Calendar, BarChart3, PieChart,
  Home, Users, Scale, AlertTriangle, CheckCircle, Clock,
  ChevronDown, Download, RefreshCw, Eye, FileText, Printer,
  Bell, Mail, MessageSquare, Send, Settings, Palette, Moon, Sun, Save, RotateCcw
} from 'lucide-react';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, Pie, PieChart as RechartsPie, Cell, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Area, AreaChart, Line } from 'recharts';

// Types
interface Animal {
  id: string;
  tagNumber: string;
  name: string | null;
  type: string;
  breed: string;
  gender: string;
  birthDate: string;
  weight: number;
  status: string;
  color: string | null;
  penNumber: string | null;
  notes: string | null;
  purchasePrice: number | null;
  createdAt: string;
  healthRecords?: HealthRecord[];
}

interface HealthRecord {
  id: string;
  animalId: string;
  date: string;
  type: string;
  description: string;
  veterinarian: string | null;
  medication: string | null;
  cost: number | null;
  animal?: {
    name: string;
    tagNumber: string;
    type: string;
  };
}

interface BreedingRecord {
  id: string;
  maleId: string;
  femaleId: string;
  breedingDate: string;
  expectedBirth: string | null;
  actualBirth: string | null;
  offspringCount: number | null;
  status: string;
  male: { name: string; tagNumber: string; type: string };
  female: { name: string; tagNumber: string; type: string };
}

interface DashboardData {
  overview: {
    totalAnimals: number;
    totalGoats: number;
    totalPigs: number;
    healthyCount: number;
    sickCount: number;
    pregnantCount: number;
    maleCount: number;
    femaleCount: number;
  };
  weight: {
    average: number;
    min: number;
    max: number;
    total: number;
    goatAverage: number;
    goatTotal: number;
    pigAverage: number;
    pigTotal: number;
  };
  financial: {
    totalExpenses: number;
    totalIncome: number;
    profit: number;
    expensesByCategory: { category: string; _sum: { amount: number } }[];
    incomeByCategory: { category: string; _sum: { amount: number } }[];
  };
  breedDistribution: { type: string; breed: string; _count: { id: number } }[];
  penDistribution: { penNumber: string; _count: { id: number } }[];
  ageGroups: Record<string, { goats: number; pigs: number }>;
  recentHealthRecords: HealthRecord[];
  upcomingBreedings: BreedingRecord[];
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316', '#6366f1'];
const STATUS_COLORS: Record<string, string> = {
  healthy: 'badge-emerald',
  sick: 'badge-rose',
  pregnant: 'badge-amber',
  sold: 'badge-indigo',
  deceased: 'bg-gray-500',
};

const chartConfig = {
  goats: {
    label: "Goats",
    color: "#10b981",
  },
  pigs: {
    label: "Pigs", 
    color: "#f59e0b",
  },
} satisfies ChartConfig;

// Theme Settings Interface
interface ThemeSettings {
  farmName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  darkMode: boolean;
}

// Default theme
const DEFAULT_THEME: ThemeSettings = {
  farmName: 'Integrated Livestock Farm',
  primaryColor: '#059669',
  secondaryColor: '#D97706',
  accentColor: '#14B8A6',
  darkMode: false,
};

// Predefined color presets
const COLOR_PRESETS = [
  { name: 'Emerald', primary: '#059669', secondary: '#D97706', accent: '#14B8A6' },
  { name: 'Ocean Blue', primary: '#0284C7', secondary: '#F59E0B', accent: '#06B6D4' },
  { name: 'Royal Purple', primary: '#7C3AED', secondary: '#EC4899', accent: '#8B5CF6' },
  { name: 'Forest', primary: '#166534', secondary: '#CA8A04', accent: '#15803D' },
  { name: 'Sunset', primary: '#EA580C', secondary: '#DC2626', accent: '#F59E0B' },
  { name: 'Midnight', primary: '#1E40AF', secondary: '#7C3AED', accent: '#3B82F6' },
];

export default function LivestockFarmManagement() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [breedingRecords, setBreedingRecords] = useState<BreedingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Dialog states
  const [addAnimalOpen, setAddAnimalOpen] = useState(false);
  const [editAnimalOpen, setEditAnimalOpen] = useState(false);
  const [addHealthOpen, setAddHealthOpen] = useState(false);
  const [addBreedingOpen, setAddBreedingOpen] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Form states
  const [animalForm, setAnimalForm] = useState({
    tagNumber: '',
    name: '',
    type: 'goat',
    breed: '',
    gender: 'female',
    birthDate: '',
    weight: '',
    status: 'healthy',
    color: '',
    penNumber: '',
    notes: '',
    purchasePrice: '',
  });

  const [healthForm, setHealthForm] = useState({
    animalId: '',
    date: '',
    type: 'checkup',
    description: '',
    veterinarian: '',
    medication: '',
    dosage: '',
    cost: '',
  });

  const [breedingForm, setBreedingForm] = useState({
    maleId: '',
    femaleId: '',
    breedingDate: '',
    status: 'planned',
    notes: '',
  });

  // Feeding & Financial states
  const [feedingRecords, setFeedingRecords] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [incomeRecords, setIncomeRecords] = useState<any[]>([]);
  const [addFeedingOpen, setAddFeedingOpen] = useState(false);
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [addIncomeOpen, setAddIncomeOpen] = useState(false);

  const [feedingForm, setFeedingForm] = useState({
    animalId: 'none',
    date: '',
    feedType: '',
    quantity: '',
    notes: '',
  });

  const [expenseForm, setExpenseForm] = useState({
    category: 'feed',
    description: '',
    amount: '',
    date: '',
    notes: '',
  });

  const [incomeForm, setIncomeForm] = useState({
    category: 'sale',
    description: '',
    amount: '',
    date: '',
    notes: '',
  });

  // Download state
  const [downloading, setDownloading] = useState(false);

  // Notification settings state - Multiple recipients
  const [emailRecipients, setEmailRecipients] = useState<string[]>(['sushantvfx88@gmail.com']);
  const [telegramRecipients, setTelegramRecipients] = useState<string[]>(['5706291144']);
  const [newEmail, setNewEmail] = useState('');
  const [newTelegramChatId, setNewTelegramChatId] = useState('');
  const [notifSettings, setNotifSettings] = useState({
    email: 'sushantvfx88@gmail.com',
    telegramChatId: '5706291144',
    telegramBotToken: '8652070033:AAGgxHK8blOL7jlAJULhTtcoGYhov0BMTEo',
    notificationsEnabled: true,
    emailEnabled: true,
    telegramEnabled: true,
  });
  const [sendingNotif, setSendingNotif] = useState(false);

  // Theme Settings State
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(DEFAULT_THEME);
  const [tempTheme, setTempTheme] = useState<ThemeSettings>(DEFAULT_THEME);

  // Add email recipient
  const addEmailRecipient = () => {
    if (newEmail && newEmail.includes('@') && !emailRecipients.includes(newEmail)) {
      setEmailRecipients([...emailRecipients, newEmail]);
      setNewEmail('');
      toast({ title: 'Added!', description: `${newEmail} added to recipients` });
    }
  };

  // Remove email recipient
  const removeEmailRecipient = (email: string) => {
    setEmailRecipients(emailRecipients.filter(e => e !== email));
    toast({ title: 'Removed', description: `${email} removed from recipients` });
  };

  // Add Telegram recipient
  const addTelegramRecipient = () => {
    if (newTelegramChatId && !telegramRecipients.includes(newTelegramChatId)) {
      setTelegramRecipients([...telegramRecipients, newTelegramChatId]);
      setNewTelegramChatId('');
      toast({ title: 'Added!', description: `Chat ID ${newTelegramChatId} added` });
    }
  };

  // Remove Telegram recipient
  const removeTelegramRecipient = (chatId: string) => {
    setTelegramRecipients(telegramRecipients.filter(id => id !== chatId));
    toast({ title: 'Removed', description: `Chat ID ${chatId} removed` });
  };

  // Fetch data
  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/dashboard');
      const data = await res.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    }
  };

  const fetchAnimals = async () => {
    try {
      let url = '/api/animals?';
      if (filterType !== 'all') url += `type=${filterType}&`;
      if (filterStatus !== 'all') url += `status=${filterStatus}&`;
      if (searchTerm) url += `search=${searchTerm}&`;
      
      const res = await fetch(url);
      const data = await res.json();
      setAnimals(data);
    } catch (error) {
      console.error('Error fetching animals:', error);
    }
  };

  const fetchHealthRecords = async () => {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setHealthRecords(data);
    } catch (error) {
      console.error('Error fetching health records:', error);
    }
  };

  const fetchBreedingRecords = async () => {
    try {
      const res = await fetch('/api/breeding');
      const data = await res.json();
      setBreedingRecords(data);
    } catch (error) {
      console.error('Error fetching breeding records:', error);
    }
  };

  const fetchFeedingRecords = async () => {
    try {
      const res = await fetch('/api/feeding');
      const data = await res.json();
      setFeedingRecords(data);
    } catch (error) {
      console.error('Error fetching feeding records:', error);
    }
  };

  const fetchExpenses = async () => {
    try {
      const res = await fetch('/api/expenses');
      const data = await res.json();
      setExpenses(data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  const fetchIncome = async () => {
    try {
      const res = await fetch('/api/income');
      const data = await res.json();
      setIncomeRecords(data);
    } catch (error) {
      console.error('Error fetching income records:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchDashboard(), fetchAnimals(), fetchHealthRecords(), fetchBreedingRecords(), fetchFeedingRecords(), fetchExpenses(), fetchIncome()]);
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    const loadAnimals = async () => {
      try {
        let url = '/api/animals?';
        if (filterType !== 'all') url += `type=${filterType}&`;
        if (filterStatus !== 'all') url += `status=${filterStatus}&`;
        if (searchTerm) url += `search=${searchTerm}&`;
        
        const res = await fetch(url);
        const data = await res.json();
        setAnimals(data);
      } catch (error) {
        console.error('Error fetching animals:', error);
      }
    };
    loadAnimals();
  }, [filterType, filterStatus, searchTerm]);

  // Load theme settings from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('farmThemeSettings');
    if (savedTheme) {
      try {
        const parsed = JSON.parse(savedTheme);
        setThemeSettings(parsed);
        setTempTheme(parsed);
      } catch (e) {
        console.error('Failed to parse theme settings', e);
      }
    }
  }, []);

  // Apply theme to CSS variables
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary', themeSettings.primaryColor);
    root.style.setProperty('--secondary', themeSettings.secondaryColor);
    root.style.setProperty('--accent', themeSettings.accentColor);
    root.style.setProperty('--farm-primary', themeSettings.primaryColor);
    root.style.setProperty('--farm-secondary', themeSettings.secondaryColor);
    root.style.setProperty('--farm-accent', themeSettings.accentColor);

    // Apply dark mode class
    if (themeSettings.darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [themeSettings]);

  // Save theme settings
  const saveThemeSettings = () => {
    setThemeSettings(tempTheme);
    localStorage.setItem('farmThemeSettings', JSON.stringify(tempTheme));
    toast({ title: 'Theme Saved!', description: 'Your theme settings have been applied.' });
  };

  // Reset theme settings
  const resetThemeSettings = () => {
    setTempTheme(DEFAULT_THEME);
    setThemeSettings(DEFAULT_THEME);
    localStorage.setItem('farmThemeSettings', JSON.stringify(DEFAULT_THEME));
    toast({ title: 'Theme Reset', description: 'Theme has been reset to default.' });
  };

  // Apply preset theme
  const applyPreset = (preset: typeof COLOR_PRESETS[0]) => {
    setTempTheme({
      ...tempTheme,
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
      accentColor: preset.accent,
    });
  };

  // CRUD Operations
  const createAnimal = async () => {
    try {
      // Validate required fields
      if (!animalForm.tagNumber || !animalForm.type || !animalForm.breed || !animalForm.gender || !animalForm.birthDate || !animalForm.weight) {
        toast({ title: 'Validation Error', description: 'Please fill all required fields: Tag Number, Type, Breed, Gender, Birth Date, Weight', variant: 'destructive' });
        return;
      }

      const res = await fetch('/api/animals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(animalForm),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast({ title: 'Success', description: 'Animal added successfully' });
        setAddAnimalOpen(false);
        resetAnimalForm();
        fetchAnimals();
        fetchDashboard();
      } else {
        toast({ title: 'Error', description: data.error || data.details || 'Failed to add animal', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Create animal error:', error);
      toast({ title: 'Error', description: 'Network error - please check your connection', variant: 'destructive' });
    }
  };

  const updateAnimal = async () => {
    if (!selectedAnimal) return;
    try {
      const res = await fetch(`/api/animals/${selectedAnimal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(animalForm),
      });
      if (res.ok) {
        toast({ title: 'Success', description: 'Animal updated successfully' });
        setEditAnimalOpen(false);
        resetAnimalForm();
        fetchAnimals();
        fetchDashboard();
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update animal', variant: 'destructive' });
    }
  };

  const deleteAnimal = async (id: string) => {
    try {
      const res = await fetch(`/api/animals/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Success', description: 'Animal deleted successfully' });
        fetchAnimals();
        fetchDashboard();
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete animal', variant: 'destructive' });
    }
  };

  const createHealthRecord = async () => {
    try {
      const res = await fetch('/api/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(healthForm),
      });
      if (res.ok) {
        toast({ title: 'Success', description: 'Health record added successfully' });
        setAddHealthOpen(false);
        setHealthForm({ animalId: '', date: '', type: 'checkup', description: '', veterinarian: '', medication: '', dosage: '', cost: '' });
        fetchHealthRecords();
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add health record', variant: 'destructive' });
    }
  };

  const createBreedingRecord = async () => {
    try {
      // Validate required fields
      if (!breedingForm.maleId || !breedingForm.femaleId || !breedingForm.breedingDate) {
        toast({ title: 'Validation Error', description: 'Please select both male and female animals, and breeding date', variant: 'destructive' });
        return;
      }

      const res = await fetch('/api/breeding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(breedingForm),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast({ title: 'Success', description: 'Breeding record added successfully' });
        setAddBreedingOpen(false);
        setBreedingForm({ maleId: '', femaleId: '', breedingDate: '', status: 'planned', notes: '' });
        fetchBreedingRecords();
        fetchDashboard();
      } else {
        toast({ title: 'Error', description: data.error || data.details || 'Failed to add breeding record', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Breeding record error:', error);
      toast({ title: 'Error', description: 'Network error - please try again', variant: 'destructive' });
    }
  };

  const createFeedingRecord = async () => {
    try {
      // Convert 'none' to empty string for API
      const formData = {
        ...feedingForm,
        animalId: feedingForm.animalId === 'none' ? '' : feedingForm.animalId,
      };
      const res = await fetch('/api/feeding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        toast({ title: 'Success', description: 'Feeding record added successfully' });
        setAddFeedingOpen(false);
        setFeedingForm({ animalId: 'none', date: '', feedType: '', quantity: '', notes: '' });
        fetchFeedingRecords();
        fetchDashboard();
      } else {
        const errorData = await res.json();
        toast({ title: 'Error', description: errorData.error || 'Failed to add feeding record', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add feeding record', variant: 'destructive' });
    }
  };

  const createExpense = async () => {
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseForm),
      });
      if (res.ok) {
        toast({ title: 'Success', description: 'Expense added successfully' });
        setAddExpenseOpen(false);
        setExpenseForm({ category: 'feed', description: '', amount: '', date: '', notes: '' });
        fetchExpenses();
        fetchDashboard();
      } else {
        const errorData = await res.json();
        toast({ title: 'Error', description: errorData.error || 'Failed to add expense', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add expense', variant: 'destructive' });
    }
  };

  const createIncome = async () => {
    try {
      const res = await fetch('/api/income', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incomeForm),
      });
      if (res.ok) {
        toast({ title: 'Success', description: 'Income added successfully' });
        setAddIncomeOpen(false);
        setIncomeForm({ category: 'sale', description: '', amount: '', date: '', notes: '' });
        fetchIncome();
        fetchDashboard();
      } else {
        const errorData = await res.json();
        toast({ title: 'Error', description: errorData.error || 'Failed to add income', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add income', variant: 'destructive' });
    }
  };

  const resetAnimalForm = () => {
    setAnimalForm({
      tagNumber: '',
      name: '',
      type: 'goat',
      breed: '',
      gender: 'female',
      birthDate: '',
      weight: '',
      status: 'healthy',
      color: '',
      penNumber: '',
      notes: '',
      purchasePrice: '',
    });
    setSelectedAnimal(null);
  };

  const openEditDialog = (animal: Animal) => {
    setSelectedAnimal(animal);
    setAnimalForm({
      tagNumber: animal.tagNumber,
      name: animal.name || '',
      type: animal.type,
      breed: animal.breed,
      gender: animal.gender,
      birthDate: animal.birthDate.split('T')[0],
      weight: animal.weight.toString(),
      status: animal.status,
      color: animal.color || '',
      penNumber: animal.penNumber || '',
      notes: animal.notes || '',
      purchasePrice: animal.purchasePrice?.toString() || '',
    });
    setEditAnimalOpen(true);
  };

  const openDetailsDialog = async (animal: Animal) => {
    try {
      const res = await fetch(`/api/animals/${animal.id}`);
      const data = await res.json();
      setSelectedAnimal(data);
      setDetailsOpen(true);
    } catch (error) {
      console.error('Error fetching animal details:', error);
    }
  };

  // Format currency
  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return '₹0';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Prepare chart data
  const animalTypeData = dashboardData ? [
    { name: 'Goats', value: dashboardData.overview.totalGoats, fill: '#10b981' },
    { name: 'Pigs', value: dashboardData.overview.totalPigs, fill: '#f59e0b' },
  ] : [];

  const statusData = dashboardData ? [
    { name: 'Healthy', value: dashboardData.overview.healthyCount, fill: '#10b981' },
    { name: 'Sick', value: dashboardData.overview.sickCount, fill: '#ef4444' },
    { name: 'Pregnant', value: dashboardData.overview.pregnantCount, fill: '#f59e0b' },
  ] : [];

  const genderData = dashboardData ? [
    { name: 'Male', value: dashboardData.overview.maleCount, fill: '#3b82f6' },
    { name: 'Female', value: dashboardData.overview.femaleCount, fill: '#ec4899' },
  ] : [];

  const ageData = dashboardData ? Object.entries(dashboardData.ageGroups).map(([age, counts]) => ({
    age,
    goats: counts.goats,
    pigs: counts.pigs,
  })) : [];

  const breedData = dashboardData?.breedDistribution.map((item, index) => ({
    name: item.breed,
    value: item._count.id,
    fill: COLORS[index % COLORS.length],
  })) || [];

  const financialData = dashboardData?.financial.expensesByCategory.map((item, index) => ({
    name: item.category.charAt(0).toUpperCase() + item.category.slice(1),
    amount: item._sum.amount || 0,
    fill: COLORS[index % COLORS.length],
  })) || [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 25%, #fefce8 50%, #f0fdfa 75%, #f0fdf4 100%)' }}>
        <div className="text-center animate-fade-in">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
            <div className="relative animate-spin rounded-full h-20 w-20 border-4 border-emerald-500 border-t-transparent mx-auto mb-6 shadow-lg shadow-emerald-500/20"></div>
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">Loading Farm Data</h2>
          <p className="text-gray-500">Preparing your livestock dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ 
      background: themeSettings.darkMode 
        ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' 
        : `linear-gradient(135deg, ${themeSettings.primaryColor}10 0%, ${themeSettings.secondaryColor}10 50%, ${themeSettings.accentColor}10 100%)`
    }}>
      {/* Header */}
      <header 
        className="text-white shadow-2xl sticky top-0 z-50"
        style={{ 
          background: `linear-gradient(135deg, ${themeSettings.primaryColor} 0%, ${themeSettings.accentColor} 100%)` 
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 animate-fade-in">
              <div className="relative">
                <div className="absolute inset-0 bg-white/30 rounded-xl blur-md"></div>
                <div className="relative bg-white/20 backdrop-blur-sm p-3 rounded-xl border border-white/20">
                  <Home className="h-8 w-8" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{themeSettings.farmName}</h1>
                <p className="text-emerald-100 text-sm font-medium">Goat & Pig Management System</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-6 text-sm bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20">
                <div className="flex items-center gap-2 hover:scale-105 transition-transform">
                  <Gauge className="h-5 w-5 text-emerald-200" />
                  <span>Goats: <strong className="text-white">{dashboardData?.overview.totalGoats || 0}</strong></span>
                </div>
                <div className="w-px h-4 bg-white/20"></div>
                <div className="flex items-center gap-2 hover:scale-105 transition-transform">
                  <PawPrint className="h-5 w-5 text-amber-200" />
                  <span>Pigs: <strong className="text-white">{dashboardData?.overview.totalPigs || 0}</strong></span>
                </div>
              </div>
              <Button 
                variant="secondary" 
                size="sm" 
                className="btn-modern bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 text-white"
                onClick={() => { fetchDashboard(); fetchAnimals(); fetchHealthRecords(); fetchBreedingRecords(); }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="tabs-modern grid grid-cols-3 md:grid-cols-9 gap-2">
            <TabsTrigger value="dashboard" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-500/30">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="animals" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-500/30">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Animals</span>
            </TabsTrigger>
            <TabsTrigger value="health" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-rose-500/30">
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Health</span>
            </TabsTrigger>
            <TabsTrigger value="breeding" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-rose-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-pink-500/30">
              <Baby className="h-4 w-4" />
              <span className="hidden sm:inline">Breeding</span>
            </TabsTrigger>
            <TabsTrigger value="feeding" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-amber-500/30">
              <Utensils className="h-4 w-4" />
              <span className="hidden sm:inline">Feeding</span>
            </TabsTrigger>
            <TabsTrigger value="financial" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-500/30">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Financial</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-violet-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-500/30">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Reports</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-cyan-500/30">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Alerts</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-500 data-[state=active]:to-gray-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-slate-500/30">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6 animate-fade-in-up">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="stat-card stat-card-emerald animate-fade-in delay-100 hover-lift cursor-pointer">
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-sm font-medium mb-1">Total Goats</p>
                      <p className="text-4xl font-bold tracking-tight">{dashboardData?.overview.totalGoats || 0}</p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                      <Gauge className="h-8 w-8" />
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/20">
                    <p className="text-xs text-white/70">Active livestock</p>
                  </div>
                </div>
              </div>
              <div className="stat-card stat-card-amber animate-fade-in delay-200 hover-lift cursor-pointer">
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-sm font-medium mb-1">Total Pigs</p>
                      <p className="text-4xl font-bold tracking-tight">{dashboardData?.overview.totalPigs || 0}</p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                      <PawPrint className="h-8 w-8" />
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/20">
                    <p className="text-xs text-white/70">Active livestock</p>
                  </div>
                </div>
              </div>
              <div className="stat-card stat-card-teal animate-fade-in delay-300 hover-lift cursor-pointer">
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-sm font-medium mb-1">Healthy</p>
                      <p className="text-4xl font-bold tracking-tight">{dashboardData?.overview.healthyCount || 0}</p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                      <CheckCircle className="h-8 w-8" />
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/20">
                    <p className="text-xs text-white/70">Good condition</p>
                  </div>
                </div>
              </div>
              <div className="stat-card stat-card-rose animate-fade-in delay-400 hover-lift cursor-pointer">
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-sm font-medium mb-1">Need Attention</p>
                      <p className="text-4xl font-bold tracking-tight">{(dashboardData?.overview.sickCount || 0) + (dashboardData?.overview.pregnantCount || 0)}</p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                      <AlertTriangle className="h-8 w-8" />
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/20">
                    <p className="text-xs text-white/70">Sick + Pregnant</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="chart-container-modern hover-lift">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg">
                      <PieChart className="h-5 w-5 text-white" />
                    </div>
                    Animal Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[200px]">
                    <RechartsPie width={200} height={200}>
                      <Pie
                        data={animalTypeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {animalTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </RechartsPie>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card className="chart-container-modern hover-lift">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-r from-rose-500 to-pink-500 rounded-lg">
                      <Activity className="h-5 w-5 text-white" />
                    </div>
                    Health Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[200px]">
                    <RechartsPie width={200} height={200}>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </RechartsPie>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card className="chart-container-modern hover-lift">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-r from-violet-500 to-purple-500 rounded-lg">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    Gender Ratio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[200px]">
                    <RechartsPie width={200} height={200}>
                      <Pie
                        data={genderData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {genderData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </RechartsPie>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            {/* Age Distribution & Breed Chart */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="chart-container-modern hover-lift">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-lg">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                    Age Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[250px]">
                    <BarChart data={ageData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" />
                      <YAxis dataKey="age" type="category" width={80} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="goats" fill="url(#goatGradient)" name="Goats" radius={[0, 8, 8, 0]} />
                      <Bar dataKey="pigs" fill="url(#pigGradient)" name="Pigs" radius={[0, 8, 8, 0]} />
                      <defs>
                        <linearGradient id="goatGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#059669" />
                        </linearGradient>
                        <linearGradient id="pigGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#d97706" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card className="chart-container-modern hover-lift">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg">
                      <Scale className="h-5 w-5 text-white" />
                    </div>
                    Weight Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-emerald-50 to-green-100 p-4 rounded-xl border border-emerald-200/50 hover:shadow-lg transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <Gauge className="h-4 w-4 text-emerald-600" />
                        <p className="text-sm text-emerald-700 font-medium">Avg Goat Weight</p>
                      </div>
                      <p className="text-3xl font-bold text-emerald-700">{dashboardData?.weight.goatAverage?.toFixed(1) || 0} <span className="text-lg">kg</span></p>
                      <p className="text-xs text-emerald-500 mt-1">Total: {dashboardData?.weight.goatTotal?.toFixed(0) || 0} kg</p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-50 to-orange-100 p-4 rounded-xl border border-amber-200/50 hover:shadow-lg transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <PawPrint className="h-4 w-4 text-amber-600" />
                        <p className="text-sm text-amber-700 font-medium">Avg Pig Weight</p>
                      </div>
                      <p className="text-3xl font-bold text-amber-700">{dashboardData?.weight.pigAverage?.toFixed(1) || 0} <span className="text-lg">kg</span></p>
                      <p className="text-xs text-amber-500 mt-1">Total: {dashboardData?.weight.pigTotal?.toFixed(0) || 0} kg</p>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-gray-50 to-slate-100 p-4 rounded-xl border border-gray-200/50">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm text-gray-600 font-medium">Weight Range</span>
                      <span className="text-sm font-bold text-gray-800 bg-white px-3 py-1 rounded-full shadow-sm">{dashboardData?.weight.min?.toFixed(1) || 0} - {dashboardData?.weight.max?.toFixed(1) || 0} kg</span>
                    </div>
                    <Progress value={60} className="h-3 progress-modern" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats & Recent Activity */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="chart-container-modern hover-lift">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    Breed Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px] scroll-area-modern">
                    <div className="space-y-2">
                      {breedData.map((breed, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl hover:from-gray-100 hover:to-slate-100 transition-colors cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: breed.fill }} />
                            <span className="text-sm font-medium text-gray-700">{breed.name}</span>
                          </div>
                          <Badge className="badge-modern badge-emerald">{breed.value}</Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card className="chart-container-modern hover-lift">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-r from-sky-500 to-blue-500 rounded-lg">
                      <Clock className="h-5 w-5 text-white" />
                    </div>
                    Upcoming Births
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px] scroll-area-modern">
                    {dashboardData?.upcomingBreedings.length ? (
                      <div className="space-y-2">
                        {dashboardData.upcomingBreedings.map((breeding, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-cyan-50 to-teal-50 rounded-xl border border-cyan-100 hover:shadow-md transition-shadow">
                            <div>
                              <p className="text-sm font-semibold text-gray-800">{breeding.female.name}</p>
                              <p className="text-xs text-gray-500 mt-0.5">Expected: {formatDate(breeding.expectedBirth)}</p>
                            </div>
                            <Badge className="badge-modern badge-teal">{breeding.female.type}</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                        <Clock className="h-12 w-12 mb-2 opacity-30" />
                        <p className="text-sm">No upcoming births</p>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Animals Tab */}
          <TabsContent value="animals" className="space-y-4 animate-fade-in-up">
            <Card className="card-modern">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    Animal Management
                  </CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search animals..."
                        className="pl-9 w-48 input-modern"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="w-28 input-modern">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="goat">Goats</SelectItem>
                        <SelectItem value="pig">Pig</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-32 input-modern">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="healthy">Healthy</SelectItem>
                        <SelectItem value="sick">Sick</SelectItem>
                        <SelectItem value="pregnant">Pregnant</SelectItem>
                      </SelectContent>
                    </Select>
                    <Dialog open={addAnimalOpen} onOpenChange={setAddAnimalOpen}>
                      <DialogTrigger asChild>
                        <Button className="btn-modern btn-gradient-emerald">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Animal
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg dialog-modern">
                        <DialogHeader>
                          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Add New Animal</DialogTitle>
                          <DialogDescription>Enter details for the new animal</DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4 py-4">
                          <div className="space-y-2">
                            <Label>Tag Number *</Label>
                            <Input value={animalForm.tagNumber} onChange={(e) => setAnimalForm({ ...animalForm, tagNumber: e.target.value })} placeholder="GOAT-0001" />
                          </div>
                          <div className="space-y-2">
                            <Label>Name</Label>
                            <Input value={animalForm.name} onChange={(e) => setAnimalForm({ ...animalForm, name: e.target.value })} placeholder="Name" />
                          </div>
                          <div className="space-y-2">
                            <Label>Type *</Label>
                            <Select value={animalForm.type} onValueChange={(v) => setAnimalForm({ ...animalForm, type: v })}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="goat">Goat</SelectItem>
                                <SelectItem value="pig">Pig</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Breed *</Label>
                            <Input value={animalForm.breed} onChange={(e) => setAnimalForm({ ...animalForm, breed: e.target.value })} placeholder="Breed" />
                          </div>
                          <div className="space-y-2">
                            <Label>Gender *</Label>
                            <Select value={animalForm.gender} onValueChange={(v) => setAnimalForm({ ...animalForm, gender: v })}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Birth Date *</Label>
                            <Input type="date" value={animalForm.birthDate} onChange={(e) => setAnimalForm({ ...animalForm, birthDate: e.target.value })} />
                          </div>
                          <div className="space-y-2">
                            <Label>Weight (kg) *</Label>
                            <Input type="number" value={animalForm.weight} onChange={(e) => setAnimalForm({ ...animalForm, weight: e.target.value })} placeholder="0" />
                          </div>
                          <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={animalForm.status} onValueChange={(v) => setAnimalForm({ ...animalForm, status: v })}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="healthy">Healthy</SelectItem>
                                <SelectItem value="sick">Sick</SelectItem>
                                <SelectItem value="pregnant">Pregnant</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Color</Label>
                            <Input value={animalForm.color} onChange={(e) => setAnimalForm({ ...animalForm, color: e.target.value })} placeholder="Color" />
                          </div>
                          <div className="space-y-2">
                            <Label>Pen Number</Label>
                            <Input value={animalForm.penNumber} onChange={(e) => setAnimalForm({ ...animalForm, penNumber: e.target.value })} placeholder="A1" />
                          </div>
                          <div className="space-y-2">
                            <Label>Purchase Price</Label>
                            <Input type="number" value={animalForm.purchasePrice} onChange={(e) => setAnimalForm({ ...animalForm, purchasePrice: e.target.value })} placeholder="0" />
                          </div>
                          <div className="col-span-2 space-y-2">
                            <Label>Notes</Label>
                            <Input value={animalForm.notes} onChange={(e) => setAnimalForm({ ...animalForm, notes: e.target.value })} placeholder="Additional notes..." />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setAddAnimalOpen(false)}>Cancel</Button>
                          <Button className="btn-modern btn-gradient-emerald" onClick={createAnimal}>Add Animal</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] scroll-area-modern">
                  <div className="rounded-xl overflow-hidden border border-gray-200">
                    <Table>
                      <TableHeader className="table-modern">
                        <TableRow className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
                          <TableHead className="text-white font-semibold">Tag #</TableHead>
                          <TableHead className="text-white font-semibold">Name</TableHead>
                          <TableHead className="text-white font-semibold">Type</TableHead>
                          <TableHead className="text-white font-semibold">Breed</TableHead>
                          <TableHead className="text-white font-semibold">Gender</TableHead>
                          <TableHead className="text-white font-semibold">Weight</TableHead>
                          <TableHead className="text-white font-semibold">Status</TableHead>
                          <TableHead className="text-white font-semibold">Pen</TableHead>
                          <TableHead className="text-white font-semibold text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {animals.map((animal, index) => (
                          <TableRow 
                            key={animal.id} 
                            className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-emerald-50/50 transition-colors`}
                          >
                            <TableCell className="font-mono text-sm font-medium text-emerald-700">{animal.tagNumber}</TableCell>
                            <TableCell className="font-medium">{animal.name || '-'}</TableCell>
                            <TableCell>
                              <Badge className={`${animal.type === 'goat' ? 'badge-emerald' : 'badge-amber'} badge-modern`}>
                                {animal.type === 'goat' ? <Gauge className="h-3 w-3 mr-1" /> : <PawPrint className="h-3 w-3 mr-1" />}
                                {animal.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-600">{animal.breed}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">{animal.gender}</Badge>
                            </TableCell>
                            <TableCell className="font-medium">{animal.weight} kg</TableCell>
                            <TableCell>
                              <Badge className={`badge-modern ${STATUS_COLORS[animal.status]}`}>
                                {animal.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-600">{animal.penNumber || '-'}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button size="sm" variant="ghost" className="hover:bg-emerald-100 hover:text-emerald-700" onClick={() => openDetailsDialog(animal)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" className="hover:bg-amber-100 hover:text-amber-700" onClick={() => openEditDialog(animal)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="ghost" className="hover:bg-rose-100 hover:text-rose-700">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="dialog-modern">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Animal</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete {animal.name || animal.tagNumber}? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction className="btn-modern btn-gradient-rose" onClick={() => deleteAnimal(animal.id)}>Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Health Tab */}
          <TabsContent value="health" className="space-y-4 animate-fade-in-up">
            <Card className="card-modern">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-r from-rose-500 to-pink-500 rounded-lg">
                      <Heart className="h-5 w-5 text-white" />
                    </div>
                    Health Records
                  </CardTitle>
                  <Dialog open={addHealthOpen} onOpenChange={setAddHealthOpen}>
                    <DialogTrigger asChild>
                      <Button className="btn-modern btn-gradient-rose">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Record
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="dialog-modern">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">Add Health Record</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                          <Label>Animal *</Label>
                          <Select value={healthForm.animalId} onValueChange={(v) => setHealthForm({ ...healthForm, animalId: v })}>
                            <SelectTrigger><SelectValue placeholder="Select animal" /></SelectTrigger>
                            <SelectContent>
                              {animals.map((a) => (
                                <SelectItem key={a.id} value={a.id}>{a.tagNumber} - {a.name || 'Unnamed'}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Date *</Label>
                            <Input type="date" value={healthForm.date} onChange={(e) => setHealthForm({ ...healthForm, date: e.target.value })} />
                          </div>
                          <div className="space-y-2">
                            <Label>Type *</Label>
                            <Select value={healthForm.type} onValueChange={(v) => setHealthForm({ ...healthForm, type: v })}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="vaccination">Vaccination</SelectItem>
                                <SelectItem value="treatment">Treatment</SelectItem>
                                <SelectItem value="checkup">Checkup</SelectItem>
                                <SelectItem value="medication">Medication</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Description *</Label>
                          <Input value={healthForm.description} onChange={(e) => setHealthForm({ ...healthForm, description: e.target.value })} placeholder="Description" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Veterinarian</Label>
                            <Input value={healthForm.veterinarian} onChange={(e) => setHealthForm({ ...healthForm, veterinarian: e.target.value })} placeholder="Dr. Name" />
                          </div>
                          <div className="space-y-2">
                            <Label>Medication</Label>
                            <Input value={healthForm.medication} onChange={(e) => setHealthForm({ ...healthForm, medication: e.target.value })} placeholder="Medication" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Dosage</Label>
                            <Input value={healthForm.dosage} onChange={(e) => setHealthForm({ ...healthForm, dosage: e.target.value })} placeholder="Dosage" />
                          </div>
                          <div className="space-y-2">
                            <Label>Cost</Label>
                            <Input type="number" value={healthForm.cost} onChange={(e) => setHealthForm({ ...healthForm, cost: e.target.value })} placeholder="0" />
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setAddHealthOpen(false)}>Cancel</Button>
                        <Button className="bg-red-500 hover:bg-red-600" onClick={createHealthRecord}>Add Record</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] scroll-area-modern">
                  <div className="rounded-xl overflow-hidden border border-gray-200">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600">
                          <TableHead className="text-white font-semibold">Date</TableHead>
                          <TableHead className="text-white font-semibold">Animal</TableHead>
                          <TableHead className="text-white font-semibold">Type</TableHead>
                          <TableHead className="text-white font-semibold">Description</TableHead>
                          <TableHead className="text-white font-semibold">Veterinarian</TableHead>
                          <TableHead className="text-white font-semibold">Medication</TableHead>
                          <TableHead className="text-white font-semibold">Cost</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {healthRecords.map((record, index) => (
                          <TableRow 
                            key={record.id}
                            className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-rose-50/50 transition-colors`}
                          >
                            <TableCell className="font-medium">{formatDate(record.date)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="border-emerald-200 text-emerald-700">{record.animal?.tagNumber}</Badge>
                                <span className="text-gray-700">{record.animal?.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={`badge-modern ${record.type === 'vaccination' ? 'badge-teal' : record.type === 'treatment' ? 'badge-rose' : record.type === 'checkup' ? 'badge-emerald' : 'badge-indigo'}`}>
                                {record.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-600">{record.description}</TableCell>
                            <TableCell className="text-gray-600">{record.veterinarian || '-'}</TableCell>
                            <TableCell className="text-gray-600">{record.medication || '-'}</TableCell>
                            <TableCell className="font-semibold text-emerald-600">{formatCurrency(record.cost)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Breeding Tab */}
          <TabsContent value="breeding" className="space-y-4 animate-fade-in-up">
            <Card className="card-modern">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg">
                      <Baby className="h-5 w-5 text-white" />
                    </div>
                    Breeding Records
                  </CardTitle>
                  <Dialog open={addBreedingOpen} onOpenChange={setAddBreedingOpen}>
                    <DialogTrigger asChild>
                      <Button className="btn-modern btn-gradient-pink">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Record
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="dialog-modern">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">Add Breeding Record</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                          <Label>Male *</Label>
                          <Select value={breedingForm.maleId} onValueChange={(v) => setBreedingForm({ ...breedingForm, maleId: v })}>
                            <SelectTrigger><SelectValue placeholder="Select male" /></SelectTrigger>
                            <SelectContent>
                              {animals.filter(a => a.gender === 'male').map((a) => (
                                <SelectItem key={a.id} value={a.id}>{a.tagNumber} - {a.name || 'Unnamed'}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Female *</Label>
                          <Select value={breedingForm.femaleId} onValueChange={(v) => setBreedingForm({ ...breedingForm, femaleId: v })}>
                            <SelectTrigger><SelectValue placeholder="Select female" /></SelectTrigger>
                            <SelectContent>
                              {animals.filter(a => a.gender === 'female').map((a) => (
                                <SelectItem key={a.id} value={a.id}>{a.tagNumber} - {a.name || 'Unnamed'}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Breeding Date *</Label>
                            <Input type="date" value={breedingForm.breedingDate} onChange={(e) => setBreedingForm({ ...breedingForm, breedingDate: e.target.value })} />
                          </div>
                          <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={breedingForm.status} onValueChange={(v) => setBreedingForm({ ...breedingForm, status: v })}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="planned">Planned</SelectItem>
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Notes</Label>
                          <Input value={breedingForm.notes} onChange={(e) => setBreedingForm({ ...breedingForm, notes: e.target.value })} placeholder="Notes" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setAddBreedingOpen(false)}>Cancel</Button>
                        <Button className="bg-pink-500 hover:bg-pink-600" onClick={createBreedingRecord}>Add Record</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] scroll-area-modern">
                  <div className="rounded-xl overflow-hidden border border-gray-200">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600">
                          <TableHead className="text-white font-semibold">Breeding Date</TableHead>
                          <TableHead className="text-white font-semibold">Male</TableHead>
                          <TableHead className="text-white font-semibold">Female</TableHead>
                          <TableHead className="text-white font-semibold">Expected Birth</TableHead>
                          <TableHead className="text-white font-semibold">Offspring</TableHead>
                          <TableHead className="text-white font-semibold">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {breedingRecords.map((record, index) => (
                          <TableRow 
                            key={record.id}
                            className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-pink-50/50 transition-colors`}
                          >
                            <TableCell className="font-medium">{formatDate(record.breedingDate)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="border-blue-200 text-blue-700">{record.male.tagNumber}</Badge>
                                <span className="text-gray-700">{record.male.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="border-pink-200 text-pink-700">{record.female.tagNumber}</Badge>
                                <span className="text-gray-700">{record.female.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-600">{formatDate(record.expectedBirth)}</TableCell>
                            <TableCell className="font-medium">{record.offspringCount || '-'}</TableCell>
                            <TableCell>
                              <Badge className={`badge-modern ${record.status === 'completed' ? 'badge-emerald' : record.status === 'confirmed' ? 'badge-teal' : 'badge-amber'}`}>
                                {record.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feeding Tab */}
          <TabsContent value="feeding" className="space-y-4 animate-fade-in-up">
            <Card className="card-modern">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg">
                      <Utensils className="h-5 w-5 text-white" />
                    </div>
                    Feeding Records
                  </CardTitle>
                  <Dialog open={addFeedingOpen} onOpenChange={setAddFeedingOpen}>
                    <DialogTrigger asChild>
                      <Button className="btn-modern bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Feeding Record
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="dialog-modern">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">Add Feeding Record</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                          <Label>Animal (Optional - leave empty for all)</Label>
                          <Select value={feedingForm.animalId} onValueChange={(v) => setFeedingForm({ ...feedingForm, animalId: v })}>
                            <SelectTrigger><SelectValue placeholder="Select animal or leave empty" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">All Animals (General)</SelectItem>
                              {animals.map((a) => (
                                <SelectItem key={a.id} value={a.id}>{a.tagNumber} - {a.name || 'Unnamed'}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Date *</Label>
                            <Input type="date" value={feedingForm.date} onChange={(e) => setFeedingForm({ ...feedingForm, date: e.target.value })} />
                          </div>
                          <div className="space-y-2">
                            <Label>Feed Type *</Label>
                            <Select value={feedingForm.feedType} onValueChange={(v) => setFeedingForm({ ...feedingForm, feedType: v })}>
                              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="hay">Hay</SelectItem>
                                <SelectItem value="grass">Fresh Grass</SelectItem>
                                <SelectItem value="grain">Grain Mix</SelectItem>
                                <SelectItem value="alfalfa">Alfalfa</SelectItem>
                                <SelectItem value="minerals">Mineral Blocks</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Quantity (kg) *</Label>
                          <Input type="number" value={feedingForm.quantity} onChange={(e) => setFeedingForm({ ...feedingForm, quantity: e.target.value })} placeholder="Enter quantity" />
                        </div>
                        <div className="space-y-2">
                          <Label>Notes</Label>
                          <Input value={feedingForm.notes} onChange={(e) => setFeedingForm({ ...feedingForm, notes: e.target.value })} placeholder="Additional notes" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setAddFeedingOpen(false)}>Cancel</Button>
                        <Button className="bg-amber-500 hover:bg-amber-600" onClick={createFeedingRecord}>Add Record</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] scroll-area-modern">
                  {feedingRecords.length > 0 ? (
                    <div className="rounded-xl overflow-hidden border border-gray-200">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                            <TableHead className="text-white font-semibold">Date</TableHead>
                            <TableHead className="text-white font-semibold">Animal</TableHead>
                            <TableHead className="text-white font-semibold">Feed Type</TableHead>
                            <TableHead className="text-white font-semibold">Quantity</TableHead>
                            <TableHead className="text-white font-semibold">Notes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {feedingRecords.map((record, index) => (
                            <TableRow key={record.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-amber-50/30'} hover:bg-amber-50/50 transition-colors`}>
                              <TableCell className="font-medium">{formatDate(record.date)}</TableCell>
                              <TableCell>
                                {record.animal ? (
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline">{record.animal.tagNumber}</Badge>
                                    <span>{record.animal.name || '-'}</span>
                                  </div>
                                ) : (
                                  <Badge className="badge-amber">All Animals</Badge>
                                )}
                              </TableCell>
                              <TableCell className="capitalize">{record.feedType}</TableCell>
                              <TableCell className="font-medium">{record.quantity} kg</TableCell>
                              <TableCell className="text-gray-600">{record.notes || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                      <Utensils className="h-16 w-16 mb-4 opacity-30" />
                      <p className="text-lg font-medium">No feeding records yet</p>
                      <p className="text-sm">Click "Add Feeding Record" to get started</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financial" className="space-y-4 animate-fade-in-up">
            {/* Summary Cards */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="stat-card stat-card-emerald animate-fade-in delay-100 hover-lift cursor-pointer">
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-sm font-medium mb-1">Total Income</p>
                      <p className="text-3xl font-bold tracking-tight">{formatCurrency(dashboardData?.financial.totalIncome)}</p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                      <TrendingUp className="h-7 w-7" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="stat-card stat-card-rose animate-fade-in delay-200 hover-lift cursor-pointer">
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-sm font-medium mb-1">Total Expenses</p>
                      <p className="text-3xl font-bold tracking-tight">{formatCurrency(dashboardData?.financial.totalExpenses)}</p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                      <TrendingDown className="h-7 w-7" />
                    </div>
                  </div>
                </div>
              </div>
              <div className={`stat-card ${dashboardData?.financial.profit && dashboardData.financial.profit >= 0 ? 'stat-card-teal' : 'stat-card-rose'} animate-fade-in delay-300 hover-lift cursor-pointer`}>
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-sm font-medium mb-1">Net Profit/Loss</p>
                      <p className="text-3xl font-bold tracking-tight">{formatCurrency(dashboardData?.financial.profit)}</p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                      <DollarSign className="h-7 w-7" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Expenses Section */}
            <Card className="card-modern">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-r from-rose-500 to-red-500 rounded-lg">
                      <TrendingDown className="h-5 w-5 text-white" />
                    </div>
                    Expenses
                  </CardTitle>
                  <Dialog open={addExpenseOpen} onOpenChange={setAddExpenseOpen}>
                    <DialogTrigger asChild>
                      <Button className="btn-modern bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Expense
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="dialog-modern">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-bold bg-gradient-to-r from-rose-600 to-red-600 bg-clip-text text-transparent">Add Expense</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Category *</Label>
                            <Select value={expenseForm.category} onValueChange={(v) => setExpenseForm({ ...expenseForm, category: v })}>
                              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="feed">Feed</SelectItem>
                                <SelectItem value="veterinary">Veterinary</SelectItem>
                                <SelectItem value="equipment">Equipment</SelectItem>
                                <SelectItem value="labor">Labor</SelectItem>
                                <SelectItem value="utilities">Utilities</SelectItem>
                                <SelectItem value="maintenance">Maintenance</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Amount (₹) *</Label>
                            <Input type="number" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} placeholder="Enter amount" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Description *</Label>
                          <Input value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} placeholder="Enter description" />
                        </div>
                        <div className="space-y-2">
                          <Label>Date *</Label>
                          <Input type="date" value={expenseForm.date} onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Notes</Label>
                          <Input value={expenseForm.notes} onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })} placeholder="Additional notes" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setAddExpenseOpen(false)}>Cancel</Button>
                        <Button className="bg-rose-500 hover:bg-rose-600" onClick={createExpense}>Add Expense</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px] scroll-area-modern">
                  {expenses.length > 0 ? (
                    <div className="rounded-xl overflow-hidden border border-gray-200">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gradient-to-r from-rose-500 to-red-500">
                            <TableHead className="text-white font-semibold">Date</TableHead>
                            <TableHead className="text-white font-semibold">Category</TableHead>
                            <TableHead className="text-white font-semibold">Description</TableHead>
                            <TableHead className="text-white font-semibold text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {expenses.slice(0, 10).map((expense, index) => (
                            <TableRow key={expense.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-rose-50/30'} hover:bg-rose-50/50 transition-colors`}>
                              <TableCell className="font-medium">{formatDate(expense.date)}</TableCell>
                              <TableCell className="capitalize">{expense.category}</TableCell>
                              <TableCell className="text-gray-600">{expense.description}</TableCell>
                              <TableCell className="text-right font-bold text-rose-600">{formatCurrency(expense.amount)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                      <TrendingDown className="h-12 w-12 mb-2 opacity-30" />
                      <p>No expenses recorded yet</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Income Section */}
            <Card className="card-modern">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    Income
                  </CardTitle>
                  <Dialog open={addIncomeOpen} onOpenChange={setAddIncomeOpen}>
                    <DialogTrigger asChild>
                      <Button className="btn-modern btn-gradient-emerald">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Income
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="dialog-modern">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Add Income</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Category *</Label>
                            <Select value={incomeForm.category} onValueChange={(v) => setIncomeForm({ ...incomeForm, category: v })}>
                              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="sale">Animal Sale</SelectItem>
                                <SelectItem value="milk">Milk Sale</SelectItem>
                                <SelectItem value="meat">Meat Sale</SelectItem>
                                <SelectItem value="breeding">Breeding Services</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Amount (₹) *</Label>
                            <Input type="number" value={incomeForm.amount} onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })} placeholder="Enter amount" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Description *</Label>
                          <Input value={incomeForm.description} onChange={(e) => setIncomeForm({ ...incomeForm, description: e.target.value })} placeholder="Enter description" />
                        </div>
                        <div className="space-y-2">
                          <Label>Date *</Label>
                          <Input type="date" value={incomeForm.date} onChange={(e) => setIncomeForm({ ...incomeForm, date: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Notes</Label>
                          <Input value={incomeForm.notes} onChange={(e) => setIncomeForm({ ...incomeForm, notes: e.target.value })} placeholder="Additional notes" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setAddIncomeOpen(false)}>Cancel</Button>
                        <Button className="btn-gradient-emerald" onClick={createIncome}>Add Income</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px] scroll-area-modern">
                  {incomeRecords.length > 0 ? (
                    <div className="rounded-xl overflow-hidden border border-gray-200">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gradient-to-r from-emerald-500 to-teal-500">
                            <TableHead className="text-white font-semibold">Date</TableHead>
                            <TableHead className="text-white font-semibold">Category</TableHead>
                            <TableHead className="text-white font-semibold">Description</TableHead>
                            <TableHead className="text-white font-semibold text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {incomeRecords.slice(0, 10).map((income, index) => (
                            <TableRow key={income.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-emerald-50/30'} hover:bg-emerald-50/50 transition-colors`}>
                              <TableCell className="font-medium">{formatDate(income.date)}</TableCell>
                              <TableCell className="capitalize">{income.category}</TableCell>
                              <TableCell className="text-gray-600">{income.description}</TableCell>
                              <TableCell className="text-right font-bold text-emerald-600">{formatCurrency(income.amount)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                      <TrendingUp className="h-12 w-12 mb-2 opacity-30" />
                      <p>No income recorded yet</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-4 animate-fade-in-up">
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-lg">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  PDF Reports
                </CardTitle>
                <CardDescription>
                  Generate and download printable reports for your farm records
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Full Farm Report */}
                  <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-violet-50 hover:shadow-xl transition-shadow hover-lift">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="bg-gradient-to-r from-indigo-500 to-violet-500 p-3 rounded-xl shadow-lg shadow-indigo-500/20">
                          <FileText className="h-8 w-8 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-800">Complete Farm Report</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Comprehensive report including all animals, health records, breeding data, and financial summary.
                          </p>
                          <ul className="text-xs text-gray-500 mt-3 space-y-1">
                            <li className="flex items-center gap-2">
                              <CheckCircle className="h-3 w-3 text-emerald-500" />
                              Animal inventory (105 goats, 50 pigs)
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="h-3 w-3 text-emerald-500" />
                              Health records summary
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="h-3 w-3 text-emerald-500" />
                              Breeding schedule
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="h-3 w-3 text-emerald-500" />
                              Financial overview
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="h-3 w-3 text-emerald-500" />
                              Breed distribution
                            </li>
                          </ul>
                          <Button 
                            className="mt-4 btn-modern btn-gradient-indigo"
                            onClick={async () => {
                              setDownloading(true);
                              try {
                                // Open report in new tab - it's HTML that can be printed to PDF
                                window.open('/api/reports?type=full', '_blank');
                                toast({ title: 'Success', description: 'Report opened in new tab. Use Print button to save as PDF.' });
                              } catch (error) {
                                toast({ title: 'Error', description: 'Failed to generate report', variant: 'destructive' });
                              } finally {
                                setDownloading(false);
                              }
                            }}
                            disabled={downloading}
                          >
                            {downloading ? (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Download className="h-4 w-4 mr-2" />
                                Download PDF
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Print Options */}
                  <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 hover:shadow-xl transition-shadow hover-lift">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-3 rounded-xl shadow-lg shadow-emerald-500/20">
                          <Printer className="h-8 w-8 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-800">Quick Print View</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Open a printer-friendly version of the dashboard directly in your browser.
                          </p>
                          <div className="mt-4 space-y-2">
                            <Button 
                              variant="outline"
                              className="w-full border-2 border-emerald-300 text-emerald-700 hover:bg-emerald-100 font-semibold"
                              onClick={() => window.print()}
                            >
                              <Printer className="h-4 w-4 mr-2" />
                              Print Current Page
                            </Button>
                          </div>
                          
                          <div className="mt-6 p-3 bg-amber-100 rounded-xl border border-amber-200">
                            <p className="text-xs text-amber-800">
                              <strong>Tip:</strong> For best printing results, use Chrome or Edge browser and select "Save as PDF" in print dialog.
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Report Preview Section */}
                <div className="mt-8">
                  <h3 className="font-bold text-lg mb-4 text-gray-800">Report Contents Preview</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 bg-gradient-to-r from-gray-50 to-slate-100 rounded-xl hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        <span className="font-medium text-sm text-gray-700">Overview Statistics</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Total animals, health status, gender ratio, weight statistics
                      </p>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-gray-50 to-slate-100 rounded-xl hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        <span className="font-medium text-sm text-gray-700">Breed Distribution</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        All breeds with counts for goats and pigs separately
                      </p>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-gray-50 to-slate-100 rounded-xl hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        <span className="font-medium text-sm text-gray-700">Financial Summary</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Income, expenses, profit/loss, category breakdown
                      </p>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-gray-50 to-slate-100 rounded-xl hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        <span className="font-medium text-sm text-gray-700">Health Records</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Recent vaccinations, treatments, and checkups
                      </p>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-gray-50 to-slate-100 rounded-xl hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        <span className="font-medium text-sm text-gray-700">Upcoming Births</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Expected delivery dates for pregnant animals
                      </p>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-gray-50 to-slate-100 rounded-xl hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        <span className="font-medium text-sm text-gray-700">Complete Animal List</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        All 155 animals with details and status
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4 animate-fade-in-up">
            {/* Recipients Management */}
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-lg">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  Notification Recipients
                </CardTitle>
                <CardDescription>
                  Manage who receives farm alerts - add multiple people
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Email Recipients */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                        <Mail className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="font-semibold text-gray-800">Email Recipients ({emailRecipients.length})</h3>
                    </div>
                    
                    <div className="space-y-2">
                      {emailRecipients.map((email, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 hover:shadow-md transition-shadow">
                          <span className="text-sm font-medium text-gray-700">{email}</span>
                          {emailRecipients.length > 1 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-rose-500 hover:text-rose-700 hover:bg-rose-100 h-8 px-2"
                              onClick={() => removeEmailRecipient(email)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex gap-2">
                      <Input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="Add email address"
                        className="flex-1 input-modern"
                        onKeyDown={(e) => e.key === 'Enter' && addEmailRecipient()}
                      />
                      <Button onClick={addEmailRecipient} size="sm" className="btn-modern btn-gradient-emerald">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Telegram Recipients */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-gradient-to-r from-cyan-500 to-sky-500 rounded-lg">
                        <MessageSquare className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="font-semibold text-gray-800">Telegram Recipients ({telegramRecipients.length})</h3>
                    </div>
                    
                    <div className="space-y-2">
                      {telegramRecipients.map((chatId, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-cyan-50 to-sky-50 rounded-xl border border-cyan-100 hover:shadow-md transition-shadow">
                          <span className="text-sm font-medium text-gray-700">Chat ID: {chatId}</span>
                          {telegramRecipients.length > 1 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-rose-500 hover:text-rose-700 hover:bg-rose-100 h-8 px-2"
                              onClick={() => removeTelegramRecipient(chatId)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex gap-2">
                      <Input
                        value={newTelegramChatId}
                        onChange={(e) => setNewTelegramChatId(e.target.value)}
                        placeholder="Add Chat ID"
                        className="flex-1 input-modern"
                        onKeyDown={(e) => e.key === 'Enter' && addTelegramRecipient()}
                      />
                      <Button onClick={addTelegramRecipient} size="sm" className="btn-modern btn-gradient-emerald">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Email Notifications Card */}
              <Card className="card-modern hover-lift">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                        <Mail className="h-5 w-5 text-white" />
                      </div>
                      Email Settings
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="email-toggle" className="text-sm text-gray-600">Enabled</Label>
                      <input
                        id="email-toggle"
                        type="checkbox"
                        checked={notifSettings.emailEnabled}
                        onChange={(e) => setNotifSettings({ ...notifSettings, emailEnabled: e.target.checked })}
                        className="toggle toggle-primary w-10 h-6 rounded-full appearance-none bg-gray-200 checked:bg-emerald-500 cursor-pointer transition-colors"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                    <h4 className="font-semibold text-blue-800 mb-2">Email Alerts Include:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li className="flex items-center gap-2"><CheckCircle className="h-3 w-3" /> Animal health alerts</li>
                      <li className="flex items-center gap-2"><CheckCircle className="h-3 w-3" /> Upcoming birth reminders</li>
                      <li className="flex items-center gap-2"><CheckCircle className="h-3 w-3" /> Daily farm summary</li>
                      <li className="flex items-center gap-2"><CheckCircle className="h-3 w-3" /> Critical notifications</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Telegram Notifications Card */}
              <Card className="card-modern hover-lift">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-2 bg-gradient-to-r from-cyan-500 to-sky-500 rounded-lg">
                        <MessageSquare className="h-5 w-5 text-white" />
                      </div>
                      Telegram Settings
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="telegram-toggle" className="text-sm text-gray-600">Enabled</Label>
                      <input
                        id="telegram-toggle"
                        type="checkbox"
                        checked={notifSettings.telegramEnabled}
                        onChange={(e) => setNotifSettings({ ...notifSettings, telegramEnabled: e.target.checked })}
                        className="toggle toggle-primary w-10 h-6 rounded-full appearance-none bg-gray-200 checked:bg-emerald-500 cursor-pointer transition-colors"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label>Bot Token</Label>
                    <Input
                      type="password"
                      value={notifSettings.telegramBotToken}
                      onChange={(e) => setNotifSettings({ ...notifSettings, telegramBotToken: e.target.value })}
                      placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                      className="input-modern"
                    />
                  </div>
                  
                  <div className="p-4 bg-gradient-to-r from-cyan-50 to-sky-50 rounded-xl border border-cyan-100 mt-4">
                    <h4 className="font-semibold text-cyan-800 mb-2">How to Add Others:</h4>
                    <ol className="text-sm text-cyan-700 space-y-1 list-decimal list-inside">
                      <li>Other person sends message to your bot</li>
                      <li>Get their Chat ID from getUpdates API</li>
                      <li>Add their Chat ID above</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="card-modern hover-lift">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg">
                    <Send className="h-5 w-5 text-white" />
                  </div>
                  Quick Actions
                </CardTitle>
                <CardDescription>
                  Send test notifications to all recipients
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4">
                  <Button
                    className="btn-modern bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg shadow-blue-500/20"
                    onClick={async () => {
                      setSendingNotif(true);
                      try {
                        const res = await fetch('/api/notifications/send?XTransformPort=3002', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ type: 'test' }),
                        });
                        const data = await res.json();
                        if (data.success) {
                          toast({ title: '✅ Test Sent!', description: `Sent to ${emailRecipients.length} emails and ${telegramRecipients.length} Telegram chats` });
                        } else {
                          toast({ title: '❌ Failed', description: 'Could not send test notification', variant: 'destructive' });
                        }
                      } catch (error) {
                        toast({ title: '❌ Error', description: 'Notification service unavailable', variant: 'destructive' });
                      }
                      setSendingNotif(false);
                    }}
                    disabled={sendingNotif}
                  >
                    {sendingNotif ? (
                      <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Sending...</>
                    ) : (
                      <><Send className="h-4 w-4 mr-2" />Send Test to All</>
                    )}
                  </Button>

                  <Button
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                    onClick={async () => {
                      setSendingNotif(true);
                      try {
                        const res = await fetch('/api/notifications/send?XTransformPort=3002', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            type: 'daily-summary',
                            data: {
                              totalGoats: dashboardData?.overview.totalGoats || 0,
                              totalPigs: dashboardData?.overview.totalPigs || 0,
                              healthyCount: dashboardData?.overview.healthyCount || 0,
                              sickCount: dashboardData?.overview.sickCount || 0,
                              pregnantCount: dashboardData?.overview.pregnantCount || 0,
                              upcomingBirths: dashboardData?.upcomingBreedings.length || 0,
                            },
                          }),
                        });
                        const data = await res.json();
                        if (data.success) {
                          toast({ title: '✅ Summary Sent!', description: 'Daily summary sent to all recipients' });
                        } else {
                          toast({ title: '❌ Failed', description: 'Could not send summary', variant: 'destructive' });
                        }
                      } catch (error) {
                        toast({ title: '❌ Error', description: 'Notification service unavailable', variant: 'destructive' });
                      }
                      setSendingNotif(false);
                    }}
                    disabled={sendingNotif}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Send Daily Summary
                  </Button>

                  <Button
                    variant="outline"
                    className="border-amber-500 text-amber-600 hover:bg-amber-50"
                    onClick={async () => {
                      setSendingNotif(true);
                      try {
                        const res = await fetch('/api/notifications/send?XTransformPort=3002', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            type: 'alert',
                            title: '🚨 Sick Animal Alert',
                            message: 'This is a test sick animal notification. In production, this would alert you about real health issues.',
                          }),
                        });
                        const data = await res.json();
                        if (data.success) {
                          toast({ title: '✅ Alert Sent!', description: 'Test alert sent to all recipients' });
                        } else {
                          toast({ title: '❌ Failed', description: 'Could not send alert', variant: 'destructive' });
                        }
                      } catch (error) {
                        toast({ title: '❌ Error', description: 'Notification service unavailable', variant: 'destructive' });
                      }
                      setSendingNotif(false);
                    }}
                    disabled={sendingNotif}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Test Alert
                  </Button>

                  <Button
                    variant="outline"
                    className="border-purple-500 text-purple-600 hover:bg-purple-50"
                    onClick={async () => {
                      toast({ title: '✅ Settings Saved!', description: `${emailRecipients.length} emails, ${telegramRecipients.length} Telegram chats configured` });
                    }}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Save Settings
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Status Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 bg-emerald-500 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-semibold text-emerald-800">Email Notifications Active</span>
                </div>
                <p className="text-sm text-emerald-700">
                  <strong className="text-emerald-900">{emailRecipients.length}</strong> email recipient(s) configured
                </p>
              </div>
              <div className="p-4 bg-gradient-to-r from-cyan-50 to-sky-50 rounded-xl border border-cyan-200 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 bg-cyan-500 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-semibold text-cyan-800">Telegram Bot Active</span>
                </div>
                <p className="text-sm text-cyan-700">
                  <strong className="text-cyan-900">{telegramRecipients.length}</strong> Telegram recipient(s) using @prince7878bot
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Settings Tab - Theme Customizer */}
          <TabsContent value="settings" className="space-y-6 animate-fade-in-up">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Farm Identity */}
              <Card className="card-modern hover-lift">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-r from-slate-500 to-gray-600 rounded-lg">
                      <Home className="h-5 w-5 text-white" />
                    </div>
                    Farm Identity
                  </CardTitle>
                  <CardDescription>Customize your farm name and branding</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Farm Name</Label>
                    <Input
                      value={tempTheme.farmName}
                      onChange={(e) => setTempTheme({ ...tempTheme, farmName: e.target.value })}
                      placeholder="Enter your farm name"
                      className="input-modern"
                    />
                    <p className="text-xs text-gray-500">This name will appear in the header</p>
                  </div>
                </CardContent>
              </Card>

              {/* Color Theme */}
              <Card className="card-modern hover-lift">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                      <Palette className="h-5 w-5 text-white" />
                    </div>
                    Color Theme
                  </CardTitle>
                  <CardDescription>Choose your favorite color scheme</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Color Presets</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {COLOR_PRESETS.map((preset) => (
                        <button
                          key={preset.name}
                          onClick={() => applyPreset(preset)}
                          className={`p-2 rounded-lg border-2 transition-all hover:scale-105 ${
                            tempTheme.primaryColor === preset.primary
                              ? 'border-gray-800 shadow-lg'
                              : 'border-gray-200'
                          }`}
                        >
                          <div className="flex gap-1 mb-1 justify-center">
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.primary }} />
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.secondary }} />
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.accent }} />
                          </div>
                          <span className="text-xs font-medium">{preset.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Custom Colors */}
              <Card className="card-modern hover-lift">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg">
                      <Palette className="h-5 w-5 text-white" />
                    </div>
                    Custom Colors
                  </CardTitle>
                  <CardDescription>Fine-tune individual colors</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Primary</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={tempTheme.primaryColor}
                          onChange={(e) => setTempTheme({ ...tempTheme, primaryColor: e.target.value })}
                          className="w-10 h-10 rounded-lg border-2 border-gray-200 cursor-pointer"
                        />
                        <Input
                          value={tempTheme.primaryColor}
                          onChange={(e) => setTempTheme({ ...tempTheme, primaryColor: e.target.value })}
                          className="w-24 text-xs"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Secondary</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={tempTheme.secondaryColor}
                          onChange={(e) => setTempTheme({ ...tempTheme, secondaryColor: e.target.value })}
                          className="w-10 h-10 rounded-lg border-2 border-gray-200 cursor-pointer"
                        />
                        <Input
                          value={tempTheme.secondaryColor}
                          onChange={(e) => setTempTheme({ ...tempTheme, secondaryColor: e.target.value })}
                          className="w-24 text-xs"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Accent</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={tempTheme.accentColor}
                          onChange={(e) => setTempTheme({ ...tempTheme, accentColor: e.target.value })}
                          className="w-10 h-10 rounded-lg border-2 border-gray-200 cursor-pointer"
                        />
                        <Input
                          value={tempTheme.accentColor}
                          onChange={(e) => setTempTheme({ ...tempTheme, accentColor: e.target.value })}
                          className="w-24 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Display Mode */}
              <Card className="card-modern hover-lift">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-r from-gray-600 to-gray-800 rounded-lg">
                      {tempTheme.darkMode ? <Moon className="h-5 w-5 text-white" /> : <Sun className="h-5 w-5 text-white" />}
                    </div>
                    Display Mode
                  </CardTitle>
                  <CardDescription>Toggle between light and dark mode</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-slate-100 rounded-xl">
                    <div className="flex items-center gap-3">
                      {tempTheme.darkMode ? <Moon className="h-6 w-6 text-indigo-600" /> : <Sun className="h-6 w-6 text-amber-500" />}
                      <div>
                        <p className="font-semibold">{tempTheme.darkMode ? 'Dark Mode' : 'Light Mode'}</p>
                        <p className="text-sm text-gray-500">
                          {tempTheme.darkMode ? 'Easier on eyes at night' : 'Bright and clean look'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setTempTheme({ ...tempTheme, darkMode: !tempTheme.darkMode })}
                      className={`relative w-14 h-7 rounded-full transition-colors ${
                        tempTheme.darkMode ? 'bg-indigo-600' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                          tempTheme.darkMode ? 'translate-x-8' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Preview Section */}
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                    <Eye className="h-5 w-5 text-white" />
                  </div>
                  Live Preview
                </CardTitle>
                <CardDescription>See how your theme will look</CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className="p-6 rounded-xl"
                  style={{
                    background: `linear-gradient(135deg, ${tempTheme.primaryColor}20, ${tempTheme.secondaryColor}20)`,
                    borderColor: tempTheme.primaryColor,
                    borderWidth: 2,
                  }}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className="p-3 rounded-xl"
                      style={{ backgroundColor: tempTheme.primaryColor }}
                    >
                      <Home className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{tempTheme.farmName}</h3>
                      <p className="text-gray-500 text-sm">Preview of your farm header</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="px-4 py-2 rounded-lg text-white font-medium"
                      style={{ backgroundColor: tempTheme.primaryColor }}
                    >
                      Primary Button
                    </button>
                    <button
                      className="px-4 py-2 rounded-lg text-white font-medium"
                      style={{ backgroundColor: tempTheme.secondaryColor }}
                    >
                      Secondary Button
                    </button>
                    <button
                      className="px-4 py-2 rounded-lg text-white font-medium"
                      style={{ backgroundColor: tempTheme.accentColor }}
                    >
                      Accent Button
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 justify-center">
              <Button
                onClick={saveThemeSettings}
                className="btn-gradient-emerald px-8 py-6 text-lg"
              >
                <Save className="h-5 w-5 mr-2" />
                Save Theme Settings
              </Button>
              <Button
                onClick={resetThemeSettings}
                variant="outline"
                className="px-8 py-6 text-lg border-2"
              >
                <RotateCcw className="h-5 w-5 mr-2" />
                Reset to Default
              </Button>
            </div>

            {/* Info Box */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>💡 Tip:</strong> Your theme settings are saved in your browser and will persist when you visit again. Changes apply immediately after saving.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Edit Animal Dialog */}
      <Dialog open={editAnimalOpen} onOpenChange={setEditAnimalOpen}>
        <DialogContent className="max-w-lg dialog-modern">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Edit Animal</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Tag Number *</Label>
              <Input value={animalForm.tagNumber} onChange={(e) => setAnimalForm({ ...animalForm, tagNumber: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={animalForm.name} onChange={(e) => setAnimalForm({ ...animalForm, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Type *</Label>
              <Select value={animalForm.type} onValueChange={(v) => setAnimalForm({ ...animalForm, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="goat">Goat</SelectItem>
                  <SelectItem value="pig">Pig</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Breed *</Label>
              <Input value={animalForm.breed} onChange={(e) => setAnimalForm({ ...animalForm, breed: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Gender *</Label>
              <Select value={animalForm.gender} onValueChange={(v) => setAnimalForm({ ...animalForm, gender: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Birth Date *</Label>
              <Input type="date" value={animalForm.birthDate} onChange={(e) => setAnimalForm({ ...animalForm, birthDate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Weight (kg) *</Label>
              <Input type="number" value={animalForm.weight} onChange={(e) => setAnimalForm({ ...animalForm, weight: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={animalForm.status} onValueChange={(v) => setAnimalForm({ ...animalForm, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="healthy">Healthy</SelectItem>
                  <SelectItem value="sick">Sick</SelectItem>
                  <SelectItem value="pregnant">Pregnant</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Pen Number</Label>
              <Input value={animalForm.penNumber} onChange={(e) => setAnimalForm({ ...animalForm, penNumber: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Purchase Price</Label>
              <Input type="number" value={animalForm.purchasePrice} onChange={(e) => setAnimalForm({ ...animalForm, purchasePrice: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditAnimalOpen(false)}>Cancel</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={updateAnimal}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Animal Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Animal Details</DialogTitle>
          </DialogHeader>
          {selectedAnimal && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Tag Number</p>
                  <p className="font-medium">{selectedAnimal.tagNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{selectedAnimal.name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <Badge className={selectedAnimal.type === 'goat' ? 'bg-green-500' : 'bg-amber-500'}>{selectedAnimal.type}</Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Breed</p>
                  <p className="font-medium">{selectedAnimal.breed}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Gender</p>
                  <p className="font-medium capitalize">{selectedAnimal.gender}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Weight</p>
                  <p className="font-medium">{selectedAnimal.weight} kg</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge className={`${STATUS_COLORS[selectedAnimal.status]} text-white`}>{selectedAnimal.status}</Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pen Number</p>
                  <p className="font-medium">{selectedAnimal.penNumber || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Birth Date</p>
                  <p className="font-medium">{formatDate(selectedAnimal.birthDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Purchase Price</p>
                  <p className="font-medium">{formatCurrency(selectedAnimal.purchasePrice)}</p>
                </div>
              </div>
              {selectedAnimal.notes && (
                <div>
                  <p className="text-sm text-gray-500">Notes</p>
                  <p className="font-medium">{selectedAnimal.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm">{themeSettings.farmName} Management System | {dashboardData?.overview.totalGoats || 105} Goats | {dashboardData?.overview.totalPigs || 50} Pigs</p>
        </div>
      </footer>
    </div>
  );
}
