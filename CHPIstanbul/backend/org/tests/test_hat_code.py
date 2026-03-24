from django.utils.text import slugify

from org.models import turkish_to_ascii


def test_turkish_to_ascii():
    assert turkish_to_ascii("Şişli") == "Sisli"
    assert turkish_to_ascii("Özgür") == "Ozgur"


def test_name_to_hat_code_slug_pipeline():
    """Otomatik kod: transliterasyon + slugify (allow_unicode=False)."""
    assert (
        slugify(turkish_to_ascii("Kadın Kolları"), allow_unicode=False)
        == "kadin-kollari"
    )
    assert (
        slugify(turkish_to_ascii("İlçe Başkanlığı"), allow_unicode=False)
        == "ilce-baskanligi"
    )
