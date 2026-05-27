import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function DrawRulesModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                    onClick={() => setIsOpen(false)}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="bg-brand-card border border-brand-primary/30 rounded-2xl p-6 md:p-10 max-w-3xl w-full shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Decorative background element */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-primary/20 rounded-full blur-3xl pointer-events-none"></div>
                        
                        <div className="flex justify-between items-center mb-6 relative z-10 shrink-0">
                            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                                <span className="text-brand-primary">📜</span> Spelregler
                            </h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                                    <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-8 text-gray-300 relative z-10 overflow-y-auto pr-4 custom-scrollbar flex-1">
                            
                            <section>
                                <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-full bg-brand-primary/20 text-brand-primary flex items-center justify-center text-base">1</span> 
                                    Hur spelet fungerar
                                </h3>
                                <ul className="list-disc pl-12 space-y-2 text-lg">
                                    <li>Den som ritar får tre hemliga ord att välja mellan. Man har <strong className="text-white">5 minuter</strong> på sig att starta rundan.</li>
                                    <li>När rundan startar har ritaren <strong className="text-white">3 minuter</strong> på sig att rita bilden.</li>
                                    <li>Alla andra gissar vad bilden föreställer i chatten nere till höger. Själva gissningsrundan är öppen i max <strong className="text-white">24 timmar</strong>.</li>
                                    <li>Du har max <strong>3 gissningar</strong>. Gissar du fel 3 gånger blir du låst från att gissa i <strong>30 minuter</strong> (eller tills systemet avslöjar en ledtråd, vilket nollställer allas gissningar direkt).</li>
                                    <li>Rundan tar slut automatiskt när 4 personer gissat rätt.</li>
                                </ul>
                            </section>

                            <section>
                                <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-full bg-brand-primary/20 text-brand-primary flex items-center justify-center text-base">2</span> 
                                    Ledtrådar (Automatiska)
                                </h3>
                                <ul className="list-disc pl-12 space-y-2 text-lg">
                                    <li>Ett bokstavs-skyddsnät löser automatiskt ut en ledtråd om teamet totalt gör <strong>6 felaktiga gissningar</strong> (utan att någon gissat rätt).</li>
                                    <li>Varje gång en ny bokstav avslöjas <strong>nollställs allas gissningar</strong>, så att alla (även låsta spelare) får tillbaka sina 3 hjärtan!</li>
                                    <li>Systemet avslöjar max <strong>50%</strong> av ordets bokstäver (avrundat nedåt).</li>
                                </ul>
                            </section>

                            <section>
                                <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-full bg-brand-primary/20 text-brand-primary flex items-center justify-center text-base">3</span> 
                                    Poäng & Detaljer
                                </h3>
                                <ul className="list-disc pl-12 space-y-2 text-lg">
                                    <li>När du gissar rätt döljs gissningen för andra, så att de också får chansen! Det betyder också att stavfel som "kaffe maskin" accepteras.</li>
                                    <li><strong>Snabbast:</strong> Första personen att gissa rätt får <strong className="text-green-400">3 poäng</strong>. Tvåan får <strong className="text-green-400">2 poäng</strong>. Övriga får <strong className="text-green-400">1 poäng</strong>.</li>
                                    <li><strong>Ritaren:</strong> Får poäng baserat på hur många ledtrådar som behövdes (0 ledtrådar = <strong className="text-green-400">3 poäng</strong>, 1 ledtråd = <strong className="text-green-400">2 poäng</strong>, 2+ ledtrådar = <strong className="text-green-400">1 poäng</strong>). Dessutom ges extrapoäng för svårighetsgraden: Medium (<strong className="text-yellow-400">+1 poäng</strong>) och Svårt (<strong className="text-red-400">+2 poäng</strong>). Om ingen hinner gissa rätt innan de 24 timmarna går ut får ritaren <strong>0 poäng</strong>.</li>
                                    <li><strong>Avbryt i förtid:</strong> Ritaren kan välja att avsluta rundan i förtid och spara sina poäng, förutsatt att bilden har legat uppe i över <strong>4 timmar</strong>.</li>
                                </ul>
                            </section>

                        </div>
                        
                        <div className="mt-8 pt-6 border-t border-white/10 flex justify-end shrink-0">
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="px-8 py-3 bg-brand-primary hover:bg-brand-primaryHover text-white rounded-xl text-lg font-bold transition-all transform hover:-translate-y-1 hover:shadow-lg"
                            >
                                Okej, jag förstår!
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="w-full flex items-center justify-center gap-2 bg-brand-primary/20 hover:bg-brand-primary/40 border border-brand-primary/30 text-white p-2 rounded transition-colors mb-2 text-sm font-semibold"
                title="Läs spelreglerna"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-brand-primary">
                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 0 1 .67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 1 1-.671-1.34l.041-.022ZM12 9a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
                </svg>
                Spelregler
            </button>

            {mounted && createPortal(modalContent, document.body)}
        </>
    );
}
