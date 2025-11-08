"use client";
import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, Eye, EyeOff, Lock, Database } from 'lucide-react';

export default function PasswordAnalyzer() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [strength, setStrength] = useState(null);
  const [breachStatus, setBreachStatus] = useState(null);
  const [checking, setChecking] = useState(false);

  const analyzeStrength = (pwd) => {
    if (!pwd) return null;

    const criteria = {
      length: pwd.length >= 12,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      numbers: /\d/.test(pwd),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
      noCommon: !['password', '12345678', 'qwerty', 'abc123'].some(common => 
        pwd.toLowerCase().includes(common)
      ),
      noSequential: !/(.)\1{2,}/.test(pwd) && !/012|123|234|345|456|567|678|789|890|abc|bcd|cde/.test(pwd.toLowerCase())
    };

    const score = Object.values(criteria).filter(Boolean).length;
    const percentage = (score / 7) * 100;

    let level = 'weak';
    let color = 'bg-red-500';
    if (percentage >= 85) {
      level = 'very strong';
      color = 'bg-green-500';
    } else if (percentage >= 70) {
      level = 'strong';
      color = 'bg-blue-500';
    } else if (percentage >= 50) {
      level = 'moderate';
      color = 'bg-yellow-500';
    }

    return { criteria, score, percentage, level, color };
  };

  const checkBreach = async (pwd) => {
    if (!pwd || pwd.length < 4) return;

    setChecking(true);
    setBreachStatus(null);

    try {
      // Hash the password using SHA-1
      const encoder = new TextEncoder();
      const data = encoder.encode(pwd);
      const hashBuffer = await crypto.subtle.digest('SHA-1', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

      // Use k-anonymity: send only first 5 chars
      const prefix = hashHex.substring(0, 5);
      const suffix = hashHex.substring(5);

      const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
      const text = await response.text();

      // Check if our suffix appears in the results
      const lines = text.split('\n');
      const found = lines.find(line => line.startsWith(suffix));

      if (found) {
        const count = parseInt(found.split(':')[1]);
        setBreachStatus({
          breached: true,
          count: count.toLocaleString()
        });
      } else {
        setBreachStatus({ breached: false });
      }
    } catch (error) {
      setBreachStatus({ error: 'Unable to check breach database' });
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    setStrength(analyzeStrength(password));
    
    const debounce = setTimeout(() => {
      if (password) {
        checkBreach(password);
      } else {
        setBreachStatus(null);
      }
    }, 500);

    return () => clearTimeout(debounce);
  }, [password]);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-12 h-12 text-purple-400" />
            <h1 className="text-4xl font-bold text-white">Password Analyzer</h1>
          </div>
          <p className="text-purple-200">Check your password strength and breach status</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          {/* Password Input */}
          <div className="mb-8">
            <label className="block text-white text-sm font-semibold mb-2">
              Enter Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Type your password..."
                className="w-full px-4 py-3 pr-12 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {strength && (
            <>
              {/* Strength Meter */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white text-sm font-semibold">Strength Score</span>
                  <span className="text-white text-sm font-bold capitalize">{strength.level}</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full ${strength.color} transition-all duration-500`}
                    style={{ width: `${strength.percentage}%` }}
                  />
                </div>
                <div className="text-white/70 text-xs mt-1">{strength.score}/7 criteria met</div>
              </div>

              {/* Criteria Checklist */}
              <div className="bg-white/5 rounded-lg p-6 mb-8">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Security Criteria
                </h3>
                <div className="space-y-3">
                  {[
                    { key: 'length', label: 'At least 12 characters' },
                    { key: 'uppercase', label: 'Contains uppercase letters (A-Z)' },
                    { key: 'lowercase', label: 'Contains lowercase letters (a-z)' },
                    { key: 'numbers', label: 'Contains numbers (0-9)' },
                    { key: 'special', label: 'Contains special characters (!@#$...)' },
                    { key: 'noCommon', label: 'Not a common password' },
                    { key: 'noSequential', label: 'No repeated or sequential patterns' }
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-3">
                      {strength.criteria[key] ? (
                        <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-white/30 shrink-0" />
                      )}
                      <span className={strength.criteria[key] ? 'text-white' : 'text-white/50'}>
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Breach Status */}
              <div className="bg-white/5 rounded-lg p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Breach Database Check
                </h3>
                {checking ? (
                  <div className="text-white/70 flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Checking against HaveIBeenPwned database...
                  </div>
                ) : breachStatus?.error ? (
                  <div className="text-yellow-400 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    {breachStatus.error}
                  </div>
                ) : breachStatus?.breached ? (
                  <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 mt-1" />
                      <div>
                        <div className="text-red-400 font-semibold mb-1">Password Compromised!</div>
                        <div className="text-white/90 text-sm">
                          This password has appeared <span className="font-bold">{breachStatus.count}</span> times in data breaches.
                          <div className="mt-2 text-white/70">
                            Do not use this password. Choose a unique password instead.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : breachStatus && !breachStatus.breached ? (
                  <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 text-green-400 shrink-0" />
                      <div>
                        <div className="text-green-400 font-semibold mb-1">No Breaches Found</div>
                        <div className="text-white/90 text-sm">
                          This password hasn not been found in known data breaches.
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </>
          )}

          {!password && (
            <div className="text-center text-white/50 py-8">
              <Lock className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Enter a password to analyze its strength and check for breaches</p>
            </div>
          )}
        </div>


      </div>
    </div>
  );
}