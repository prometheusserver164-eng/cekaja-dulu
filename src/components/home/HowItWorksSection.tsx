import { Link2, Sparkles, ClipboardCheck } from 'lucide-react';
import { Card, CardContent } from '../ui/card';

export function HowItWorksSection() {
  const steps = [
    {
      icon: Link2,
      step: '1',
      title: 'Salin Link Produk',
      description: 'Copy link produk dari Tokopedia, Shopee, Bukalapak, atau Lazada',
      color: 'bg-primary/10 text-primary',
    },
    {
      icon: Sparkles,
      step: '2',
      title: 'Analisis Otomatis',
      description: 'Sistem kami menganalisis ribuan review untuk kasih ringkasan akurat',
      color: 'bg-secondary/10 text-secondary',
    },
    {
      icon: ClipboardCheck,
      step: '3',
      title: 'Lihat Hasil Review',
      description: 'Dapatkan insight lengkap: sentimen, kelebihan, kekurangan, dan harga',
      color: 'bg-success/10 text-success',
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Cara Kerja <span className="text-gradient">CekLagi</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Cuma 3 langkah mudah untuk belanja lebih cerdas
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {steps.map((step, index) => (
            <Card 
              key={step.step} 
              className="relative overflow-hidden border-2 border-transparent hover:border-primary/20 transition-all duration-300 hover:-translate-y-1 hover:card-shadow-hover animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-8 text-center">
                {/* Step number */}
                <div className="absolute top-4 right-4 text-6xl font-bold text-muted/20">
                  {step.step}
                </div>

                {/* Icon */}
                <div className={`w-16 h-16 rounded-2xl ${step.color} flex items-center justify-center mx-auto mb-6`}>
                  <step.icon className="h-8 w-8" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Connector lines (desktop only) */}
        <div className="hidden md:flex justify-center items-center gap-4 mt-8">
          <div className="flex-1 max-w-[200px] h-0.5 bg-gradient-to-r from-primary to-secondary rounded-full" />
          <div className="flex-1 max-w-[200px] h-0.5 bg-gradient-to-r from-secondary to-success rounded-full" />
        </div>
      </div>
    </section>
  );
}
