import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Users, Calendar, ArrowRight, Briefcase } from 'lucide-react';
import { Company } from '../types';
import { CompanyLogo } from './CompanyLogo';
import { useJob } from '../context/JobContext';

interface CompanyCardProps {
  company: Company;
}

export const CompanyCard: React.FC<CompanyCardProps> = ({ company }) => {
  const navigate = useNavigate();
  const { getJobsByCompany } = useJob();
  const openRoles = getJobsByCompany(company.id);

  const handleClick = () => {
    navigate(`/companies/${company.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="group relative bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700/70 transition-all duration-200 flex flex-col justify-between cursor-pointer"
    >
      <div>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3.5">
            <CompanyLogo src={company.logoUrl} name={company.name} size="lg" />
            <div>
              <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {company.name}
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                <span>{company.headquarters}</span>
              </div>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/80">
            <Briefcase className="w-3 h-3" />
            {openRoles.length} {openRoles.length === 1 ? 'role' : 'roles'}
          </span>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed mb-5">
          {company.about}
        </p>

        <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400 py-3 border-y border-slate-100 dark:border-slate-800/80 mb-4">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>{company.employees} staff</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Est. {company.founded}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
        <span>Explore open tech positions</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
};
