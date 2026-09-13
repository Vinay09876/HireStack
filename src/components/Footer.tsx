import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, ExternalLink, ShieldCheck, Heart } from 'lucide-react';
import { useJob } from '../context/JobContext';

export const Footer: React.FC = () => {
  const { companies } = useJob();

  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand & Purpose */}
          <div className="md:col-span-1 space-y-3">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center">
                <Briefcase className="w-4 h-4" />
              </div>
              <span className="font-bold text-base text-slate-900 dark:text-white">
                Hire<span className="text-indigo-600 dark:text-indigo-400">Stack</span>
              </span>
            </Link>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Curated tech careers aggregated directly from top engineering teams including Amazon, Netflix, NVIDIA, Accenture, and more.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg w-fit border border-emerald-200 dark:border-emerald-900">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>100% Verified Corporate Career Portals</span>
            </div>
          </div>

          {/* Quick Browse */}
          <div>
            <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-3">
              Explore Roles
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/jobs?q=Software" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Software Engineering
                </Link>
              </li>
              <li>
                <Link to="/jobs?q=Frontend" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Frontend & Design Systems
                </Link>
              </li>
              <li>
                <Link to="/jobs?q=Machine+Learning" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  AI & Machine Learning
                </Link>
              </li>
              <li>
                <Link to="/jobs?q=DevOps" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  DevOps & Cloud Systems
                </Link>
              </li>
              <li>
                <Link to="/jobs?q=Product" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Product Management
                </Link>
              </li>
            </ul>
          </div>

          {/* Top Companies */}
          <div>
            <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-3">
              Top Tech Giants
            </h4>
            <ul className="space-y-2 text-xs">
              {companies.slice(0, 5).map((c) => (
                <li key={c.id}>
                  <Link
                    to={`/companies/${c.id}`}
                    className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1"
                  >
                    <span>{c.name} Careers</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Direct Redirection Notice & Navigation */}
          <div>
            <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-3">
              Platform Info
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
              HireStack is a search and discovery aggregator. We do not store applications or charge job seekers. All applications are completed on official employer portals.
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <Link to="/dashboard" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                User Dashboard
              </Link>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <Link to="/jobs" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                All Listings
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <p>© {new Date().getFullYear()} HireStack. Built for ambitious engineers worldwide.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              Direct Application Guarantee <ExternalLink className="w-3 h-3 opacity-60" />
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
