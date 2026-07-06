/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from "react";
import { 
  Copy, 
  RefreshCw, 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  History, 
  Download, 
  Settings2, 
  Lock,
  Check,
  ExternalLink,
  Info,
  BookOpen,
  KeyRound
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { v4 as uuidv4 } from "uuid";
import { toast, Toaster } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type SecretFormat = "string" | "hex" | "base64" | "uuid";

interface SecretHistory {
  id: string;
  value: string;
  timestamp: number;
  format: SecretFormat;
}

const CHARSETS = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  special: "!@#$%^&*()_+-=[]{}|;:,.<>?",
  urlSafe: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
};

export default function App() {
  const [secret, setSecret] = useState("");
  const [length, setLength] = useState(64);
  const [format, setFormat] = useState<SecretFormat>("string");
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    special: true,
    urlSafe: false,
  });
  const [copied, setCopied] = useState(false);

  // Initialize theme
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const generateSecret = useCallback(() => {
    console.log("Generating secret with options:", options, "format:", format);
    let result = "";
    
    if (format === "uuid") {
      result = uuidv4();
    } else if (format === "hex") {
      const array = new Uint8Array(length / 2);
      window.crypto.getRandomValues(array);
      result = Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
    } else if (format === "base64") {
      const array = new Uint8Array(length);
      window.crypto.getRandomValues(array);
      result = btoa(String.fromCharCode(...array)).slice(0, length);
    } else {
      let charset = "";
      if (options.urlSafe) {
        charset = CHARSETS.urlSafe;
      } else {
        if (options.uppercase) charset += CHARSETS.uppercase;
        if (options.lowercase) charset += CHARSETS.lowercase;
        if (options.numbers) charset += CHARSETS.numbers;
        if (options.special) charset += CHARSETS.special;
      }

      if (charset === "") charset = CHARSETS.lowercase + CHARSETS.numbers;

      const array = new Uint32Array(length);
      window.crypto.getRandomValues(array);
      for (let i = 0; i < length; i++) {
        result += charset[array[i] % charset.length];
      }
    }

    setSecret(result);
    setCopied(false);
  }, [format, length, options.uppercase, options.lowercase, options.numbers, options.special, options.urlSafe]);

  // Generate secret when configuration changes
  useEffect(() => {
    generateSecret();
  }, [length, format, options.uppercase, options.lowercase, options.numbers, options.special, options.urlSafe, generateSecret]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Secret copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy secret.");
    }
  };

  const downloadSecret = () => {
    const element = document.createElement("a");
    const file = new Blob([`JWT_SECRET=${secret}`], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "jwt_secret.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Secret downloaded as .txt");
  };

  const calculateEntropy = () => {
    if (format === "uuid") return 128;
    
    let charsetSize = 0;
    if (format === "hex") charsetSize = 16;
    else if (format === "base64") charsetSize = 64;
    else {
      if (options.urlSafe) charsetSize = 64;
      else {
        if (options.uppercase) charsetSize += 26;
        if (options.lowercase) charsetSize += 26;
        if (options.numbers) charsetSize += 10;
        if (options.special) charsetSize += 32;
      }
    }
    
    if (charsetSize === 0) return 0;
    return Math.floor(Math.log2(Math.pow(charsetSize, length)));
  };

  const entropy = calculateEntropy();
  const strength = entropy < 64 ? "Weak" : entropy < 128 ? "Medium" : "Strong";
  const strengthColor = entropy < 64 ? "bg-red-500" : entropy < 128 ? "bg-yellow-500" : "bg-green-500";
  const strengthIcon = entropy < 64 ? <ShieldAlert className="w-4 h-4" /> : entropy < 128 ? <Shield className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />;

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 selection:text-primary-foreground font-sans antialiased">
        <Toaster position="top-center" richColors />
        
        {/* Background Glow */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
          <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
        </div>

        <main className="relative z-10 container max-w-3xl mx-auto px-4 py-8 md:py-24">
          {/* Header */}
          <header className="text-center mb-8 md:mb-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.1 
              }}
              className="relative inline-flex items-center justify-center p-4 mb-6"
            >
              {/* Logo Glow */}
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
              <div className="relative p-4 rounded-3xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30 shadow-2xl shadow-primary/20">
                <div className="relative">
                  <KeyRound className="w-12 h-12 text-primary drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                  <div className="absolute -bottom-1 -right-1 bg-primary text-[8px] font-bold px-1 rounded-sm text-primary-foreground">
                    JWT
                  </div>
                </div>
              </div>
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-6xl font-bold tracking-tight mb-3 md:mb-4"
            >
              JWT Key <span className="text-primary">Generator</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-muted-foreground text-base md:text-lg max-w-md mx-auto px-4"
            >
              Generate cryptographically secure JWT secrets instantly in your browser.
            </motion.p>
          </header>

          <div className="grid gap-8">
            {/* Main Generator Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border-primary/20 bg-card/50 backdrop-blur-xl shadow-2xl shadow-primary/5">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-semibold flex items-center gap-2">
                      <Settings2 className="w-5 h-5 text-primary" />
                      Generator
                    </CardTitle>
                    <Badge variant="outline" className={cn("gap-1.5 px-3 py-1 border-primary/30", strengthColor.replace("bg-", "text-"))}>
                      {strengthIcon}
                      {strength}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Secret Display */}
                  <div className="relative group">
                    <div className="absolute inset-0 bg-primary/5 rounded-xl blur-lg group-hover:bg-primary/10 transition-colors" />
                    <div className="relative flex items-center gap-2 p-4 md:p-6 bg-secondary/50 rounded-xl border border-primary/10 font-mono text-sm md:text-base break-all min-h-[100px] overflow-hidden">
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={secret}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="flex-1"
                        >
                          {secret}
                        </motion.span>
                      </AnimatePresence>
                      <div className="flex flex-col gap-2">
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <Button
                                size="icon"
                                variant="ghost"
                                className="hover:bg-primary/20 hover:text-primary transition-all active:scale-95"
                                onClick={() => copyToClipboard(secret)}
                              >
                                {copied ? (
                                  <Check className="w-5 h-5 text-green-500" />
                                ) : (
                                  <Copy className="w-5 h-5" />
                                )}
                              </Button>
                            }
                          />
                          <TooltipContent>Copy to clipboard</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <Button
                                size="icon"
                                variant="ghost"
                                className="hover:bg-primary/20 hover:text-primary transition-all active:scale-95"
                                onClick={() => generateSecret()}
                              >
                                <RefreshCw className="w-5 h-5" />
                              </Button>
                            }
                          />
                          <TooltipContent>Regenerate</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </div>

                  {/* Strength Indicator */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] md:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      <span>Entropy Strength</span>
                      <span>{entropy} bits</span>
                    </div>
                    <Progress value={Math.min((entropy / 256) * 100, 100)} className="h-1.5 bg-secondary" />
                  </div>

                  {/* Tabs for Configuration */}
                  <Tabs defaultValue="format" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-secondary/50">
                      <TabsTrigger value="format">Format</TabsTrigger>
                      <TabsTrigger value="options">Options</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="format" className="pt-4 space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {(["string", "hex", "base64", "uuid"] as SecretFormat[]).map((f) => (
                          <Button
                            key={f}
                            variant={format === f ? "default" : "outline"}
                            className={cn(
                              "capitalize h-12 transition-all",
                              format === f ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "border-primary/10 hover:border-primary/30"
                            )}
                            onClick={() => setFormat(f)}
                          >
                            {f}
                          </Button>
                        ))}
                      </div>
                      
                      {format !== "uuid" && (
                        <div className="space-y-3 pt-2">
                          <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Secret Length</Label>
                          <div className="flex flex-wrap gap-2">
                            {[32, 64, 128, 256].map((l) => (
                              <Button
                                key={l}
                                variant={length === l ? "secondary" : "outline"}
                                size="sm"
                                className={cn(
                                  "flex-1 min-w-[60px] h-10 font-mono",
                                  length === l && "bg-primary/20 text-primary border-primary/30"
                                )}
                                onClick={() => setLength(l)}
                              >
                                {l}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="options" className="pt-4 space-y-4">
                      {format !== "string" && (
                        <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 mb-4 flex items-center gap-3">
                          <Info className="w-4 h-4 text-primary" />
                          <p className="text-xs text-muted-foreground">
                            Options only apply to the <span className="text-primary font-bold">String</span> format.
                          </p>
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="h-auto p-0 text-xs" 
                            onClick={() => setFormat("string")}
                          >
                            Switch to String
                          </Button>
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="uppercase" className={cn("cursor-pointer", (options.urlSafe || format !== "string") && "opacity-50")}>Uppercase (A-Z)</Label>
                            <Switch 
                              id="uppercase" 
                              checked={options.uppercase} 
                              disabled={options.urlSafe || format !== "string"}
                              onCheckedChange={(val) => setOptions(prev => ({ ...prev, uppercase: val }))} 
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="lowercase" className={cn("cursor-pointer", (options.urlSafe || format !== "string") && "opacity-50")}>Lowercase (a-z)</Label>
                            <Switch 
                              id="lowercase" 
                              checked={options.lowercase} 
                              disabled={options.urlSafe || format !== "string"}
                              onCheckedChange={(val) => setOptions(prev => ({ ...prev, lowercase: val }))} 
                            />
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="numbers" className={cn("cursor-pointer", (options.urlSafe || format !== "string") && "opacity-50")}>Numbers (0-9)</Label>
                            <Switch 
                              id="numbers" 
                              checked={options.numbers} 
                              disabled={options.urlSafe || format !== "string"}
                              onCheckedChange={(val) => setOptions(prev => ({ ...prev, numbers: val }))} 
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="special" className={cn("cursor-pointer", (options.urlSafe || format !== "string") && "opacity-50")}>Special (!@#...)</Label>
                            <Switch 
                              id="special" 
                              checked={options.special} 
                              disabled={options.urlSafe || format !== "string"}
                              onCheckedChange={(val) => setOptions(prev => ({ ...prev, special: val }))} 
                            />
                          </div>
                        </div>
                      </div>
                      <div className="pt-4 border-t border-primary/10">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="urlSafe" className={cn("cursor-pointer", format !== "string" && "opacity-50")}>URL Safe</Label>
                            <p className="text-xs text-muted-foreground">Uses only A-Z, a-z, 0-9, - and _</p>
                          </div>
                          <Switch 
                            id="urlSafe" 
                            checked={options.urlSafe} 
                            disabled={format !== "string"}
                            onCheckedChange={(val) => setOptions(prev => ({ ...prev, urlSafe: val }))} 
                          />
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button className="w-full sm:flex-1 gap-2 h-12 text-base font-semibold" onClick={() => generateSecret()}>
                    <RefreshCw className="w-4 h-4" />
                    Regenerate
                  </Button>
                  <Button variant="outline" className="w-full sm:w-auto gap-2 h-12 border-primary/20 hover:bg-primary/10" onClick={downloadSecret}>
                    <Download className="w-4 h-4" />
                    .txt
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>

            {/* .env Format Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="border-primary/10 bg-card/30">
                <CardHeader className="py-3 md:py-4">
                  <CardTitle className="text-[10px] md:text-sm font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <ExternalLink className="w-3 h-3 md:w-4 md:h-4" />
                    Environment Format
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="bg-black/40 p-3 md:p-4 rounded-lg border border-primary/5 font-mono text-xs md:text-sm flex items-center justify-between group">
                    <span className="text-primary-foreground/80 break-all pr-2">
                      JWT_SECRET=<span className="text-primary">{secret}</span>
                    </span>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity h-8 w-8"
                      onClick={() => copyToClipboard(`JWT_SECRET=${secret}`)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Informational Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="border-primary/10 bg-card/30 h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-primary" />
                        What is a JWT Secret?
                      </CardTitle>
                      <Dialog>
                        <DialogTrigger
                          render={
                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-primary/20">
                              <Info className="w-3.5 h-3.5" />
                            </Button>
                          }
                        />
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto border-primary/20 bg-card/95 backdrop-blur-xl">
                          <DialogHeader>
                            <DialogTitle className="text-2xl font-bold text-primary">The Invisible Key: Understanding the JWT Secret</DialogTitle>
                            <DialogDescription className="text-muted-foreground pt-2">
                              In the world of web development, JSON Web Tokens (JWTs) are the industry standard for keeping users logged in without making the server "remember" every single session.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-6 py-4 text-sm leading-relaxed text-foreground/90">
                            <section className="space-y-2">
                              <h3 className="text-lg font-semibold text-primary/80">The Silent Hero</h3>
                              <p>If a JWT is a digital ID card, the JWT Secret is the official government stamp that proves the card isn’t a fake. Without it, your security isn't just weak—it's non-existent.</p>
                            </section>

                            <section className="space-y-2">
                              <h3 className="text-lg font-semibold text-primary/80">What is a JWT Secret?</h3>
                              <p>A JWT Secret is a private string of characters (a "key") known only to your server. It is used to digitally sign each token you issue to a user.</p>
                              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 italic">
                                "Think of it like a wax seal on an envelope."
                              </div>
                              <ul className="list-disc pl-5 space-y-1">
                                <li><span className="font-bold">The Content:</span> Anyone can see what’s written in the letter (the JWT payload).</li>
                                <li><span className="font-bold">The Seal:</span> If the seal is broken or looks different, you know the letter has been tampered with.</li>
                                <li><span className="font-bold">The Stamp:</span> Only the person with the "Secret" stamp can create a valid seal.</li>
                              </ul>
                            </section>

                            <section className="space-y-2">
                              <h3 className="text-lg font-semibold text-primary/80">How It Works: The Signature Process</h3>
                              <p>A JWT consists of three parts: the Header, the Payload, and the Signature. The secret lives entirely in that third part.</p>
                              <ul className="list-disc pl-5 space-y-2">
                                <li><span className="font-bold">Creation:</span> When a user logs in, the server takes the Header and Payload and mixes them with the JWT Secret using a hashing algorithm (like HMAC-SHA256).</li>
                                <li><span className="font-bold">The Result:</span> This produces a unique "Signature" string.</li>
                                <li><span className="font-bold">Verification:</span> Every time the user comes back with that token, the server takes the Header and Payload again, adds its secret, and checks if the resulting signature matches the one on the token.</li>
                              </ul>
                              <p className="pt-2">If the signature matches, the server trusts the data. If it doesn't, the server knows someone tried to change their user_id or admin_status.</p>
                            </section>

                            <section className="space-y-2">
                              <h3 className="text-lg font-semibold text-primary/80">Why is the Secret so important?</h3>
                              <p>The most common misconception about JWTs is that they are "encrypted." They are not. A JWT is merely encoded (Base64), meaning anyone with a basic internet tool can paste your token and read the data inside.</p>
                              <p>Because the data is public, the Secret is the only thing providing <span className="text-primary font-bold">Integrity</span>.</p>
                              <ul className="list-disc pl-5 space-y-1">
                                <li><span className="font-bold text-red-400">Without the Secret:</span> An attacker could change their role from "user" to "admin", re-encode the token, and send it back to your server.</li>
                                <li><span className="font-bold text-green-400">With the Secret:</span> The attacker can't generate a valid signature for their fake "admin" token because they don't have your private key.</li>
                              </ul>
                            </section>

                            <section className="space-y-2">
                              <h3 className="text-lg font-semibold text-primary/80">Best Practices for 2026</h3>
                              <ul className="list-disc pl-5 space-y-2">
                                <li><span className="font-bold">Complexity is King:</span> Use long, random strings. A 256-bit (32-character) minimum is standard for HS256 algorithms.</li>
                                <li><span className="font-bold">Environment Variables:</span> Never, ever hard-code your secret in your source code. Store it in a .env file or a dedicated secret management service.</li>
                                <li><span className="font-bold">Rotate Regularly:</span> Secrets should be changed periodically. If a secret is leaked, rotating it immediately invalidates all current tokens.</li>
                                <li><span className="font-bold">Algorithm Matters:</span> While HS256 (Symmetric) uses one secret, many modern systems use RS256 (Asymmetric) with Private/Public keys.</li>
                              </ul>
                            </section>

                            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 text-center font-medium">
                              "The JWT Secret is the backbone of stateless authentication. Keep it long, keep it random, and above all—keep it secret."
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      A JWT secret is a private key used to sign and verify JSON Web Tokens. It ensures that the token hasn't been tampered with. It should be a long, random string kept strictly confidential.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
              >
                <Card className="border-primary/10 bg-card/30 h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-primary" />
                        How to Secure JWT?
                      </CardTitle>
                      <Dialog>
                        <DialogTrigger
                          render={
                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-primary/20">
                              <Info className="w-3.5 h-3.5" />
                            </Button>
                          }
                        />
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto border-primary/20 bg-card/95 backdrop-blur-xl">
                          <DialogHeader>
                            <DialogTitle className="text-2xl font-bold text-primary">Securing JSON Web Tokens (JWTs)</DialogTitle>
                            <DialogDescription className="text-muted-foreground pt-2">
                              Securing JWTs is critical because they are often stored on the client side, making them vulnerable to theft if not handled correctly.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-6 py-4 text-sm leading-relaxed text-foreground/90">
                            <section className="space-y-3">
                              <h3 className="text-lg font-semibold text-primary/80">1. Choose the Right Algorithm</h3>
                              <p>Choosing the right signing algorithm depends on your architecture:</p>
                              <ul className="list-disc pl-5 space-y-2">
                                <li><span className="font-bold">Symmetric (HS256):</span> Uses a single secret key to both sign and verify. Fast but requires sharing the secret with any service that needs to verify.</li>
                                <li><span className="font-bold">Asymmetric (RS256/ES256):</span> Uses a Private Key to sign and a Public Key to verify. More secure for microservices as the signing power stays on one secure server.</li>
                              </ul>
                              <div className="p-3 bg-black/40 rounded-lg font-mono text-[10px] md:text-xs text-primary/70 overflow-x-auto">
                                Signature = HMACSHA256(base64UrlEncode(header) + "." + base64UrlEncode(payload), secret)
                              </div>
                            </section>

                            <section className="space-y-3">
                              <h3 className="text-lg font-semibold text-primary/80">2. Secure Storage (The Frontend)</h3>
                              <p>Where you store the token determines how it can be stolen:</p>
                              <ul className="list-disc pl-5 space-y-2">
                                <li><span className="font-bold text-red-400">Don't use LocalStorage:</span> It is vulnerable to Cross-Site Scripting (XSS). Any script running on your page can read your token.</li>
                                <li><span className="font-bold text-green-400">Use HttpOnly Cookies:</span> Store your JWT in a cookie with the <code className="bg-primary/10 px-1 rounded">HttpOnly</code> and <code className="bg-primary/10 px-1 rounded">Secure</code> flags. This prevents JavaScript access.</li>
                                <li><span className="font-bold">SameSite Attribute:</span> Set your cookie to <code className="bg-primary/10 px-1 rounded">SameSite=Strict</code> or <code className="bg-primary/10 px-1 rounded">Lax</code> to protect against CSRF.</li>
                              </ul>
                            </section>

                            <section className="space-y-3">
                              <h3 className="text-lg font-semibold text-primary/80">3. Implement Token Rotation & Short Expiry</h3>
                              <p>A stolen JWT is valid until it expires. Minimize the window of opportunity:</p>
                              <ul className="list-disc pl-5 space-y-2">
                                <li><span className="font-bold">Short-lived Access Tokens:</span> Set these to expire in 5–15 minutes.</li>
                                <li><span className="font-bold">Refresh Tokens:</span> Use long-lived refresh tokens to get new access tokens.</li>
                                <li><span className="font-bold">Rotation:</span> Issue a new refresh token and invalidate the old one on every use. Detect reuse to revoke all sessions.</li>
                              </ul>
                            </section>

                            <section className="space-y-3">
                              <h3 className="text-lg font-semibold text-primary/80">4. Use a Strong Secret</h3>
                              <p>If your secret is weak, an attacker can brute-force it in seconds.</p>
                              <ul className="list-disc pl-5 space-y-1">
                                <li>Use a high-entropy, random string of at least 256 bits.</li>
                                <li>Never commit secrets to version control (GitHub).</li>
                                <li>Use Environment Variables or a Secret Manager.</li>
                              </ul>
                            </section>

                            <section className="space-y-3">
                              <h3 className="text-lg font-semibold text-primary/80">5. Validate Everything</h3>
                              <p>Your server-side code should also check:</p>
                              <ul className="list-disc pl-5 space-y-1">
                                <li><span className="font-bold">exp (Expiration):</span> Reject expired tokens.</li>
                                <li><span className="font-bold">aud (Audience):</span> Ensure intended for your specific API.</li>
                                <li><span className="font-bold">iss (Issuer):</span> Ensure created by your trusted server.</li>
                                <li><span className="font-bold">alg (Algorithm):</span> Explicitly define which algorithm you expect.</li>
                              </ul>
                            </section>

                            <section className="space-y-3">
                              <h3 className="text-lg font-semibold text-primary/80">6. The "Nuclear Option": A Blacklist</h3>
                              <p>Maintain a Token Blacklist (usually in Redis) for manual logouts or stolen tokens until their original expiration passes.</p>
                            </section>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                      <li>Use strong, unique secrets per environment.</li>
                      <li>Store secrets in environment variables.</li>
                      <li>Set short token expiration times.</li>
                      <li>Always use HTTPS for transmission.</li>
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Security Warning */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 flex gap-3 items-start"
            >
              <Info className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-red-500">Security Notice</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Everything runs client-side in your browser. We never store or transmit your secrets. 
                  <span className="font-bold text-foreground ml-1">Do not share your JWT secret publicly.</span>
                </p>
              </div>
            </motion.div>
          </div>
        </main>

        <footer className="container max-w-3xl mx-auto px-4 py-8 text-center text-xs text-muted-foreground border-t border-primary/5">
          <p>© {new Date().getFullYear()} JWT Key Generator • Secure JWT Secret Generator</p>
        </footer>
      </div>
    </TooltipProvider>
  );
}
