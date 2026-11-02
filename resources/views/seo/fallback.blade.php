@php
    $props = $page['props'];
    $identity = $props['publicSettings']['identity'];
    $component = $page['component'];
    $faculties = $props['faculties']['data'] ?? [];
@endphp
<div class="usk-site">
    <a class="usk-skip" href="#contenu">Aller au contenu</a>
    <header class="usk-header"><div class="usk-container" style="padding-block:20px"><a href="/" class="usk-brand"><img src="/assets/usk/logo.png" width="52" height="52" alt="Université Simon Kimbangu"><span>Université<strong>Simon Kimbangu</strong></span></a><nav aria-label="Navigation principale" style="display:flex;flex-wrap:wrap;gap:20px;margin-top:16px">@foreach(['/' => 'Accueil', '/about' => 'L’université', '/courses' => 'Facultés et formations', '/admission' => 'Admissions', '/blog' => 'Actualités', '/contact' => 'Contact'] as $url => $label)<a href="{{ $url }}">{{ $label }}</a>@endforeach</nav></div></header>
    <main id="contenu" class="usk-container" style="padding-block:48px">
        <h1>{{ $seo['heading'] }}</h1><p>{{ $seo['description'] }}</p>
        @if($component === 'Homepage')<img src="/assets/usk/academic-1200.webp" srcset="/assets/usk/academic-480.webp 480w, /assets/usk/academic-800.webp 800w, /assets/usk/academic-1200.webp 1200w" sizes="100vw" width="2048" height="1365" alt="Vie académique de l’Université Simon Kimbangu" fetchpriority="high" style="max-width:100%;height:auto;max-height:420px;object-fit:cover;margin-block:24px">@endif
        @if($faculties)<section><h2>Nos facultés et formations</h2>@foreach($faculties as $faculty)<article><h3><a href="/faculties/{{ $faculty['id'] }}">{{ $faculty['name'] }}</a></h3><p>{{ $faculty['description'] ?? '' }}</p><ul>@foreach($faculty['levels']['data'] ?? $faculty['levels'] ?? [] as $level)<li><a href="/course/{{ $level['id'] }}">{{ $level['title'] ?? $level['name'] ?? $level['code'] }}</a></li>@endforeach</ul></article>@endforeach</section>@endif
        @if(isset($props['faculty']))<section><h2>Les niveaux de {{ $props['faculty']['name'] }}</h2>@foreach($props['faculty']['levels'] as $level)<article><h3><a href="/course/{{ $level['id'] }}">{{ $level['title'] }}</a></h3><p>{{ $level['description'] }}</p></article>@endforeach</section>@endif
        @if(isset($props['course']))
            @php($course = $props['course'])
            <section><h2>Le programme de {{ $course['title'] }}</h2><p>{{ $course['description'] ?? '' }}</p><p>{{ $course['detail']['course_objective'] ?? '' }}</p><p>Faculté : <a href="/faculties/{{ $course['faculty']['id'] }}">{{ $course['faculty']['name'] }}</a></p>
            @if(!empty($course['courses']))<h3>Les cours du niveau</h3><ul>@foreach($course['courses'] as $subject)<li>{{ $subject['title'] }} · {{ $subject['credits'] }} crédits · {{ $subject['semester'] ? 'Semestre '.$subject['semester'] : 'Semestre à préciser' }}</li>@endforeach</ul>@endif
            @if(!empty($course['admission_conditions']))<h3>Conditions et pièces à fournir</h3><ul>@foreach($course['admission_conditions'] as $condition)<li>{{ $condition['title'] }} : {{ $condition['description'] ?? '' }}</li>@endforeach</ul>@endif
            <a href="/admission">Préparer une candidature pour ce programme</a></section>
        @endif
        @if(isset($props['posts']))<section><h2>Actualités publiées</h2>@foreach($props['posts']['data'] ?? [] as $post)<article><h3><a href="/blog/{{ $post['id'] }}">{{ $post['title'] }}</a></h3><p>{{ $post['excerpt'] ?? '' }}</p></article>@endforeach
            @if(!empty($props['posts']['links']))<nav aria-label="Pages des actualités">@foreach($props['posts']['links'] as $link)@if($link['url'])<a href="{{ $link['url'] }}">{{ html_entity_decode(strip_tags($link['label'])) }}</a> @endif @endforeach</nav>@endif
        </section>@endif
        @if(isset($props['post']))<article><p>{{ $props['post']['excerpt'] ?? '' }}</p>@foreach(preg_split('/\n\s*\n/', $props['post']['body_text'] ?? '') as $paragraph)@if(trim($paragraph))<p>{{ $paragraph }}</p>@endif @endforeach</article>@endif
        @if($component === 'Admissionpage')<section><h2>Les étapes de votre candidature</h2><ol><li>Choisir une faculté et un niveau proposés.</li><li>Créer un compte et vérifier son adresse email.</li><li>Renseigner les informations et transmettre les justificatifs demandés.</li><li>Soumettre le dossier et suivre son examen par les admissions.</li></ol><p>Les frais et conditions de l’année choisie doivent être confirmés auprès des admissions. La candidature ne garantit pas l’admission.</p><a href="/dashboard/enrollments">Commencer une candidature</a></section>@endif
        @if(in_array($component, ['Contactpage', 'Homepage', 'Aboutpage']))<section><h2>Rencontrer l’Université Simon Kimbangu</h2><p>{{ $identity['address'] }}</p><p><a href="mailto:{{ $identity['email'] }}">{{ $identity['email'] }}</a> · <a href="tel:{{ preg_replace('/\s+/', '', $identity['phone']) }}">{{ $identity['phone'] }}</a></p><a href="/admission">Consulter les informations d’admission</a></section>@endif
        @if(isset($props['document']))<section>@if($props['document']['content'])@foreach(preg_split('/\n\s*\n/', $props['document']['content']) as $paragraph)<p>{{ $paragraph }}</p>@endforeach @else<p>Ce document est en cours de validation par l’établissement. Les informations officielles seront publiées après approbation.</p><a href="/contact">Contacter l’établissement</a>@endif</section>@endif
        @if(isset($props['links']))<ul>@foreach($props['links'] as $link)<li><a href="{{ $link['path'] }}">{{ $link['title'] }}</a></li>@endforeach</ul>@endif
    </main>
    <footer class="usk-footer"><div class="usk-container"><p>{{ $identity['name'] }} · {{ $identity['address'] }}</p><nav aria-label="Informations légales">@foreach(config('seo.legal') as $definition)<a href="{{ $definition['path'] }}">{{ $definition['title'] }}</a> @endforeach <a href="/plan-du-site">Plan du site</a></nav></div></footer>
</div>
