
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Download, ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const DownloadSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [timeLeft, setTimeLeft] = useState<number>(300); // 5 minutes in seconds

  const downloadInfo = location.state?.downloadInfo;

  useEffect(() => {
    if (!downloadInfo) {
      navigate('/recommendations');
      return;
    }

    // Show toast when component mounts
    toast({
      title: "Download Ready!",
      description: "Your ebook is ready to download. The link will expire in 5 minutes.",
    });

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [downloadInfo, navigate, toast]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleDownload = () => {
    if (!downloadInfo?.url) {
      toast({
        title: "Error",
        description: "Download link is invalid or has expired.",
        variant: "destructive",
      });
      return;
    }

    // Open download in new tab
    window.open(downloadInfo.url, '_blank');
  };

  if (!downloadInfo) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-24">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/recommendations')}
            className="flex items-center gap-2 mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Recommendations
          </Button>

          <h1 className="text-3xl font-bold text-green-600">
            Payment Successful!
          </h1>
          
          <div className="bg-green-50 p-8 rounded-lg shadow-md space-y-6">
            <p className="text-xl text-gray-700">
              Your ebook is ready to download
            </p>
            
            {timeLeft > 0 ? (
              <>
                <div className="text-orange-600 font-medium">
                  Download link expires in: {formatTime(timeLeft)}
                </div>
                
                <Button
                  onClick={handleDownload}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Download className="mr-2" />
                  Download Ebook
                </Button>
              </>
            ) : (
              <div className="text-red-600">
                Download link has expired. Please contact support if you need assistance.
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DownloadSuccess;
