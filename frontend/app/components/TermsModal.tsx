import { useEffect } from "react";

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TermsModal({ isOpen, onClose }: TermsModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 backdrop-blur-[2px] p-4" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[90vh] rounded-2xl border border-slate-200/80 bg-white/95 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.45)] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white/95 border-b border-gray-200 p-6 flex justify-between items-center backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-gray-900">Общи условия</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">1. Приемане на условията</h3>
            <p className="text-gray-700">
              Чрез достъпа и използването на платформата InReach, вие приемате и се съгласявате да бъдете обвързани с условията и разпоредбите на това споразумение. Ако не сте съгласни да спазвате горепосоченото, моля, не използвайте тази услуга.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">2. Лиценз за ползване</h3>
            <p className="text-gray-700 mb-3">
              Предоставя се разрешение за временно изтегляне на едно копие от материалите (информация или софтуер) на InReach само за лично, нетърговско преходно разглеждане. Това е предоставяне на лиценз, а не прехвърляне на собственост, и съгласно този лиценз вие не можете:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Да модифицирате или копирате материалите</li>
              <li>Да използвате материалите за каквато и да е търговска цел или за публично излагане</li>
              <li>Да се опитвате да декомпилирате или извършвате обратно инженерство на софтуер, съдържащ се в InReach</li>
              <li>Да премахвате означения за авторски права или други права на собственост от материалите</li>
              <li>Да прехвърляте материалите на друго лице или да „дублирате“ материалите на друг сървър</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">3. Отказ от отговорност</h3>
            <p className="text-gray-700">
              Материалите в InReach се предоставят на база „във вида, в който са“. InReach не дава никакви гаранции, изрични или подразбиращи се, и по този начин отхвърля и отрича всички други гаранции, включително, без ограничение, подразбиращи се гаранции или условия за продаваемост, годност за определена цел или ненарушаване на интелектуална собственост или друго нарушение на права.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">4. Ограничения</h3>
            <p className="text-gray-700">
              В никакъв случай InReach или нейните доставчици не носят отговорност за каквито и да е щети (включително, без ограничение, щети от загуба на данни или печалба, или поради прекъсване на дейността), произтичащи от използването или невъзможността за използване на материалите в InReach, дори ако InReach или оторизиран представител е бил уведомен устно или писмено за възможността от такива щети.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">5. Точност на материалите</h3>
            <p className="text-gray-700">
              Материалите, появяващи се в InReach, могат да включват технически, типографски или фотографски грешки. InReach не гарантира, че някой от материалите на нейния уебсайт е точен, пълен или актуален. InReach може да прави промени в материалите, съдържащи се на нейния уебсайт, по всяко време без предизвестие.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">6. Връзки</h3>
            <p className="text-gray-700">
              InReach не е прегледала всички сайтове, свързани с нейния уебсайт, и не носи отговорност за съдържанието на никой такъв свързан сайт. Включването на която и да е връзка не означава подкрепа от страна на InReach за сайта. Използването на всеки такъв свързан уебсайт е на собствен риск на потребителя.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">7. Промени</h3>
            <p className="text-gray-700">
              InReach може да преразглежда тези условия за ползване на своя уебсайт по всяко време без предизвестие. Използвайки този уебсайт, вие се съгласявате да бъдете обвързани с текущата версия на тези условия за ползване.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">8. Приложимо право</h3>
            <p className="text-gray-700">
              Тези общи условия се уреждат и тълкуват в съответствие със законите на юрисдикцията, в която оперира InReach, и вие неотменимо се подчинявате на изключителната юрисдикция на съдилищата в това местоположение.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">9. Поведение на потребителите</h3>
            <p className="text-gray-700 mb-3">
              Вие се съгласявате да не:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Нарушавате приложимите закони или разпоредби</li>
              <li>Нарушавате правата върху интелектуалната собственост на други лица</li>
              <li>Предавате вреден или зловреден код</li>
              <li>Тормозите, злоупотребявате или наранявате други потребители</li>
              <li>Представяте невярно своята самоличност или принадлежност</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">10. Информация за контакт</h3>
            <p className="text-gray-700">
              Ако имате въпроси относно тези Общи условия, моля, свържете се с нас чрез информацията за контакт, налична на нашия уебсайт.
            </p>
          </section>

        </div>

        <div className="sticky bottom-0 bg-white/95 border-t border-gray-200 px-6 py-4 backdrop-blur-sm">
          <p className="text-sm text-gray-600">Последна актуализация: 26 март 2026 г.</p>
        </div>

      </div>
    </div>
  );
}