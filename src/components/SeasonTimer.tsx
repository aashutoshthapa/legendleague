
import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { cn } from '@/lib/utils';

interface SeasonTimerProps {
  nextReset: Date;
  isDaily?: boolean;
}

const SeasonTimer = ({ nextReset, isDaily = false }: SeasonTimerProps) => {
  const [timeRemaining, setTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  
  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const difference = nextReset.getTime() - now.getTime();
      
      if (difference <= 0) {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      
      setTimeRemaining({ days, hours, minutes, seconds });
    };
    
    calculateTimeRemaining();
    const timer = setInterval(calculateTimeRemaining, 1000);
    
    return () => clearInterval(timer);
  }, [nextReset]);
  
  const formatNumber = (num: number): string => {
    return num < 10 ? `0${num}` : num.toString();
  };
  
  const timerUnitClass = "flex flex-col items-center min-w-16";
  const valueClass = "text-2xl font-bold";
  const labelClass = "text-xs text-muted-foreground";
  
  // Format the exact reset date
  const formatResetDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  return (
    <Card className={cn(
      "glass-morphism animate-fade-in", 
      isDaily ? "border-amber-400/40" : "border-primary/40"
    )}>
      <CardContent className="py-4">
        <div className="text-center mb-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            {isDaily ? "Next Daily Reset" : "Season Reset"}
          </h3>
          {!isDaily && (
            <div className="text-xs text-muted-foreground mt-1">
              <p>{formatResetDate(nextReset)}, 5:00 AM UTC</p>
            </div>
          )}
        </div>
        
        <div className="flex justify-center space-x-2">
          {(!isDaily || timeRemaining.days > 0) && (
            <div className={timerUnitClass}>
              <span className={valueClass}>{formatNumber(timeRemaining.days)}</span>
              <span className={labelClass}>Days</span>
            </div>
          )}
          
          <div className={timerUnitClass}>
            <span className={valueClass}>{formatNumber(timeRemaining.hours)}</span>
            <span className={labelClass}>Hours</span>
          </div>
          
          <div className={timerUnitClass}>
            <span className={valueClass}>{formatNumber(timeRemaining.minutes)}</span>
            <span className={labelClass}>Minutes</span>
          </div>
          
          <div className={timerUnitClass}>
            <span className={valueClass}>{formatNumber(timeRemaining.seconds)}</span>
            <span className={labelClass}>Seconds</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SeasonTimer;
