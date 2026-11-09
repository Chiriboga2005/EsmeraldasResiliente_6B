import React, { useState } from 'react';
import { 
  PhoneCall, 
  X, 
  Copy, 
  Check, 
  ShieldAlert, 
  Flame, 
  HeartPulse, 
  Ambulance, 
  Building2, 
  Zap, 
  Droplet,
  ExternalLink,
  Search
} from 'lucide-react';

export const EmergencyContactsModal = ({ isOpen, onClose }) => {
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const contacts = [
    {
      name: 'ECU 911 Emergencias Nacional & Provincial',
      category: 'Emergencias Integradas',
      phone: '911',
      directTel: '911',
      description: 'Central única de despacho para ambulancias, rescates y seguridad ciudadana.',
      icon: ShieldAlert,
      color: 'from-red-600 to-rose-700',
      badge: '24/7 Inmediato',
      badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30'
    },
    {
      name: 'Cuerpo de Bomberos de Esmeraldas',
      category: 'Rescate Fluvial e Incendios',
      phone: '(06) 272-0102 / 098 485 2020',
      directTel: '062720102',
      description: 'Atención a desbordes de ríos, evacuación en lanchas y contingencias estructurales.',
      icon: Flame,
      color: 'from-amber-600 to-orange-700',
      badge: 'Rescate Acuático COE',
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    },
    {
      name: 'Hospital General Delfina Torres de Concha',
      category: 'Salud y Trauma',
      phone: '(06) 272-3000 / (06) 272-4040',
      directTel: '062723000',
      description: 'Unidad de emergencias médicas de tercer nivel, terapia intensiva y triage.',
      icon: HeartPulse,
      color: 'from-emerald-600 to-teal-700',
      badge: 'Atención Crítica',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    },
    {
      name: 'Cruz Roja Ecuatoriana - Junta Esmeraldas',
      category: 'Primeros Auxilios y Ambulancia',
      phone: '(06) 272-1080 / 099 882 2110',
      directTel: '062721080',
      description: 'Soporte vital básico, traslado de heridos y bancos de sangre.',
      icon: Ambulance,
      color: 'from-rose-600 to-pink-700',
      badge: 'Soporte Vital',
      badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30'
    },
    {
      name: 'Policía Nacional (Comando Subzona 8)',
      category: 'Orden y Seguridad',
      phone: '(06) 272-0043 / 115',
      directTel: '062720043',
      description: 'Custodia de zonas de evacuación, albergues temporales y patrullaje preventivo.',
      icon: Building2,
      color: 'from-blue-600 to-indigo-700',
      badge: 'Seguridad Ciudadana',
      badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    },
    {
      name: 'Sala de Crisis COE Cantonal / Gestión de Riesgos',
      category: 'Comando de Emergencias',
      phone: '(06) 272-6800 / 099 123 4567',
      directTel: '062726800',
      description: 'Mando unificado del GAD Municipal de Esmeraldas y seguimiento meteorológico.',
      icon: ShieldAlert,
      color: 'from-sky-600 to-cyan-700',
      badge: 'Mando Unificado',
      badgeColor: 'bg-sky-500/20 text-sky-400 border-sky-500/30'
    },
    {
      name: 'CNEL EP - Emergencias de Red Eléctrica',
      category: 'Servicios Básicos',
      phone: '1800-263537',
      directTel: '1800263537',
      description: 'Desconexión de transformadores sumergidos y cortes de seguridad por inundación.',
      icon: Zap,
      color: 'from-yellow-600 to-amber-700',
      badge: 'Corte Seguro',
      badgeColor: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    },
    {
      name: 'EAPA San Mateo - Distribución de Agua Segura',
      category: 'Agua y Saneamiento',
      phone: '(06) 272-2311',
      directTel: '062722311',
      description: 'Operación de tanqueros hidrantes en albergues y suministro de agua tratada.',
      icon: Droplet,
      color: 'from-cyan-600 to-blue-700',
      badge: 'Tanqueros COE',
      badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
    }
  ];

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  return (
    <div className="fixed inset-0 z-[1500] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 border-b border-slate-800 p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-600 flex items-center justify-center text-white shadow-lg">
              <PhoneCall className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-wide flex items-center gap-2">
                Directorio de Contactos de Emergencia
              </h2>
              <p className="text-xs text-slate-300">
                Líneas directas oficiales del COE Cantonal de Esmeraldas y socorristas
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Buscador */}
        <div className="p-3 bg-slate-800/80 border-b border-slate-700/80">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input 
              type="text"
              placeholder="Buscar por institución, servicio o número..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* Lista de contactos */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
          {filteredContacts.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">
              No se encontraron contactos que coincidan con la búsqueda.
            </p>
          ) : (
            filteredContacts.map((contact, idx) => {
              const Icon = contact.icon;
              const isCopied = copiedIndex === idx;

              return (
                <div 
                  key={idx}
                  className="bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 rounded-xl p-3 sm:p-3.5 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-tr ${contact.color} flex items-center justify-center text-white shrink-0 shadow-md`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-white">
                          {contact.name}
                        </h4>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${contact.badgeColor}`}>
                          {contact.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-sky-400 font-semibold">
                        {contact.category}
                      </p>
                      <p className="text-[11px] text-slate-300">
                        {contact.description}
                      </p>
                    </div>
                  </div>

                  {/* Acciones de Llamada y Copia */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => handleCopy(contact.phone, idx)}
                      className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-lg border border-slate-600 flex items-center gap-1.5 transition active:scale-95"
                      title="Copiar número"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-300" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>

                    <a
                      href={`tel:${contact.directTel}`}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-lg shadow flex items-center gap-1.5 transition active:scale-95"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>{contact.directTel === '911' ? 'Llamar 911' : 'Llamar'}</span>
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-950/80 border-t border-slate-800 px-4 py-2.5 flex items-center justify-between text-[11px] text-slate-400">
          <span>COE Provincial y Cantonal de Esmeraldas</span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            Canal de Auxilio Rápido Activo
          </span>
        </div>
      </div>
    </div>
  );
};
export default EmergencyContactsModal;
