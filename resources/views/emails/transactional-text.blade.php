UNIVERSITÉ SIMON KIMBANGU
Science · Conscience · Vérité

{!! $heading !!}

Bonjour {!! $recipientName !!},

@foreach($paragraphs as $paragraph)
{!! $paragraph !!}

@endforeach
@foreach(($details ?? []) as $label => $value)
{!! $label !!} : {!! $value !!}
@endforeach

{!! $actionLabel !!} :
{!! $actionUrl !!}

{!! $noticeTitle !!}
{!! $notice !!}

Bien cordialement,
{!! $signature !!}
Université Simon Kimbangu

Besoin d’aide ? contact@universitesk.net
N° 44, avenue Bongolo, Kauka, Kalamu · Kinshasa, RDC
{!! url('/contact') !!}
