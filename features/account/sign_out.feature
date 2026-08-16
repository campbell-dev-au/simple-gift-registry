Feature: Sign out
  As a signed-in user
  I want to sign out
  So that I can end my session, especially on a shared or public device

  @sign-out
  Scenario: Signed-in user signs out
    Given I am already signed in
    When I choose to sign out
    Then I am signed out
