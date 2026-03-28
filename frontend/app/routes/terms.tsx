import type { Route } from "./+types/terms";
import { Link } from "react-router";
import Navbar from "../components/Navbar";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Общи условия - InReach" },
    { name: "description", content: "Общи условия за ползване на InReach" },
  ];
}

export default function Terms() {
  return (
    <div className="min-h-screen bg-transparent">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-12 animate-fade-in">Общи условия</h1>
        
        <div className="space-y-8">
          <section className="animate-slide-in-up [animation-delay:100ms]">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Приемане на условията</h2>
            <p className="text-gray-700 leading-relaxed">
              Чрез достъпа и използването на платформата InReach, вие приемате и се съгласявате да бъдете обвързани с условията и разпоредбите на това споразумение. Ако не сте съгласни да спазвате горепосоченото, моля, не използвайте тази услуга.
            </p>
          </section>

          <section className="animate-slide-in-up [animation-delay:200ms]">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Лиценз за ползване</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
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

          <section className="animate-slide-in-up [animation-delay:300ms]">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Отказ от отговорност</h2>
            <p className="text-gray-700 leading-relaxed">
              Материалите в InReach се предоставят на база „във вида, в който са“. InReach не дава никакви гаранции, изрични или подразбиращи се, и по този начин отхвърля и отрича всички други гаранции, включително, без ограничение, подразбиращи се гаранции или условия за продаваемост, годност за определена цел или ненарушаване на интелектуална собственост или друго нарушение на права.
            </p>
          </section>

          <section className="animate-slide-in-up [animation-delay:400ms]">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Ограничения</h2>
            <p className="text-gray-700 leading-relaxed">
              В никакъв случай InReach или нейните доставчици не носят отговорност за каквито и да е щети (включително, без ограничение, щети от загуба на данни или печалба, или поради прекъсване на дейността), произтичащи от използването или невъзможността за използване на материалите в InReach, дори ако InReach или оторизиран представител е бил уведомен устно или писмено за възможността от такива щети.
            </p>
          </section>

          <section className="animate-slide-in-up [animation-delay:500ms]">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Точност на материалите</h2>
            <p className="text-gray-700 leading-relaxed">
              Материалите, появяващи се в InReach, могат да включват технически, типографски или фотографски грешки. InReach не гарантира, че някой от материалите на нейния уебсайт е точен, пълен или актуален. InReach може да прави промени в материалите, съдържащи се на нейния уебсайт, по всяко време без предизвестие.
            </p>
          </section>

          <section className="animate-slide-in-up [animation-delay:600ms]">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Връзки</h2>
            <p className="text-gray-700 leading-relaxed">
              InReach не е прегледала всички сайтове, свързани с нейния уебсайт, и не носи отговорност за съдържанието на никой такъв свързан сайт. Включването на която и да е връзка не означава подкрепа от страна на InReach за сайта. Използването на всеки такъв свързан уебсайт е на собствен риск на потребителя.
            </p>
          </section>

          <section className="animate-slide-in-up [animation-delay:700ms]">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Промени</h2>
            <p className="text-gray-700 leading-relaxed">
              InReach може да преразглежда тези условия за ползване на своя уебсайт по всяко време без предизвестие. Използвайки този уебсайт, вие се съгласявате да бъдете обвързани с текущата версия на тези условия за ползване.
            </p>
          </section>

          <section className="animate-slide-in-up [animation-delay:800ms]">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Приложимо право</h2>
            <p className="text-gray-700 leading-relaxed">
              Тези общи условия се уреждат и тълкуват в съответствие със законите на юрисдикцията, в която оперира InReach, и вие неотменимо се подчинявате на изключителната юрисдикция на съдилищата в това местоположение.
            </p>
          </section>

          <section className="animate-slide-in-up [animation-delay:900ms]">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Поведение на потребителите</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
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

          <section className="animate-slide-in-up [animation-delay:1000ms]">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Информация за контакт</h2>
            <p className="text-gray-700 leading-relaxed">
              Ако имате въпроси относно тези Общи условия, моля, свържете се с нас чрез информацията за контакт, налична на нашия уебсайт.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 animate-fade-in">
          <p className="text-gray-600 mb-6">
            Последна актуализация: 26 март 2026 г.
          </p>
          <Link
            to="/"
            className="inline-block bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 hover:scale-105 active:scale-95 transition-all duration-200 font-medium"
          >
            Обратно към началната страница
          </Link>
        </div>
      </div>

      <footer className="bg-gray-100 border-t border-gray-200 mt-20 animate-fade-in">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center text-black">
          <p>&copy; 2025 InReach. Предоставяне на здравни грижи в отдалечени райони.</p>
        </div>
      </footer>
    </div>
  );
}