
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const DownloadSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState<number>(300); // 5 minutes in seconds

  const downloadInfo = location.state?.downloadInfo;

  useEffect(() => {
    if (!downloadInfo) {
      navigate('/recommendations');
      return;
    }

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
  }, [downloadInfo, navigate]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!downloadInfo) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-24">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <h1 className="text-3xl font-bold text-green-600">
            Payment Successful!
          </h1>
          
          <div className="bg-green-50 p-8 rounded-lg shadow-md space-y-6">
            <p className="text-xl text-gray-700">
              Your ebook is ready to download
            </p>
            
            {timeLeft > 0 ? (
              <>
                <div className="text-orange-600">
                  Download link expires in: {formatTime(timeLeft)}
                </div>
                
                <a
                  href={downloadInfo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block"
                >
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Download className="mr-2" />
                    Download Ebook
                  </Button>
                </a>
              </>
            ) : (
              <div className="text-red-600">
                Download link has expired. Please contact support if you need assistance.
              </div>
            )}
          </div>

          <Button
            variant="outline"
            onClick={() => navigate('/recommendations')}
            className="mt-8"
          >
            Return to Recommendations
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DownloadSuccess;
